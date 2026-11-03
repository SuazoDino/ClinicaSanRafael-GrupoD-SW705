// Llamadas a la API de administración del personal (médicos, horarios y usuarios de acceso).
//
// PENDIENTE DE DECISIÓN: no está en el Sprint 1 ni en el 2. Es PROTOTIPO sobre la BD simulada
// (compartido/prototipo/bdPrueba.js) con las tablas reales: medico, horario_medico, especialidad, usuario y rol.
// Si se aprueba, cada función se reemplaza por la llamada http indicada en su comentario.
import {
  ESPECIALIDADES, errorApi, escribir, leer, medicoDe, siguienteId,
} from '../../compartido/prototipo/bdPrueba.js'
import { diaSemana, hoyISO } from '../../compartido/utilidades/formato.js'

const minutos = (hora) => { const [h, m] = hora.split(':').map(Number); return h * 60 + m }
const conSegundos = (hora) => (hora.length === 5 ? `${hora}:00` : hora)

// Contraseña temporal que el trabajador cambia al entrar (el backend guardaría solo su hash argon2)
function claveTemporal() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const azar = (n) => Math.floor(Math.random() * n)
  return `Sica-${letras[azar(24)]}${letras[azar(24)].toLowerCase()}${1000 + azar(9000)}`
}

function validarUsername(datos, username, idUsuario) {
  if (!/^[a-z0-9._]{3,40}$/.test(username)) {
    throw errorApi(422, 'El usuario debe tener de 3 a 40 caracteres: minúsculas, números, punto o guion bajo.')
  }
  if (datos.usuarios.some((u) => u.username === username && u.id_usuario !== idUsuario)) {
    throw errorApi(409, `El usuario «${username}» ya existe.`)
  }
}

function crearUsuarioEn(datos, username, rol) {
  validarUsername(datos, username)
  const usuario = { id_usuario: siguienteId(datos, 'usuario'), username, rol, activo: true }
  datos.usuarios.push(usuario)
  return usuario
}

function buscarUsuario(datos, idUsuario) {
  const u = datos.usuarios.find((x) => x.id_usuario === idUsuario)
  if (!u) throw errorApi(404, 'Usuario no encontrado')
  return u
}

// Citas por venir que todavía ocupan un cupo (se revisan antes de cambiar un horario)
const citasPendientes = (datos, idMedico) => datos.citas.filter((c) => c.id_medico === idMedico
  && c.fecha >= hoyISO() && ['registrada', 'confirmada'].includes(c.estado))

export const especialidadesApi = {
  listar: () => leer(() => ESPECIALIDADES),
}

export const medicosAdminApi = {
  // GET /admin/medicos → médico + especialidad + horario + usuario de acceso
  listar: () => leer((datos) => datos.medicos.map((m) => ({
    ...medicoDe(datos, m.id_medico),
    horarios: datos.horarios.filter((h) => h.id_medico === m.id_medico)
      .sort((a, b) => a.dia_semana - b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio)),
    usuario: datos.usuarios.find((u) => u.id_usuario === m.id_usuario) ?? null,
    citas_pendientes: citasPendientes(datos, m.id_medico).length,
  })).sort((a, b) => a.apellidos.localeCompare(b.apellidos))),

  // POST /admin/medicos  ·  PUT /admin/medicos/{id}   (colegiatura única, igual que en la BD)
  guardar: ({ id_medico, nombres, apellidos, colegiatura, id_especialidad, crear_usuario, username }) => escribir((datos) => {
    const cmp = colegiatura.trim().toUpperCase()
    if (!nombres.trim() || !apellidos.trim()) throw errorApi(422, 'Completa nombres y apellidos.')
    if (!/^CMP\d{4,9}$/.test(cmp)) throw errorApi(422, 'La colegiatura debe tener el formato CMP seguido de números (p. ej. CMP10009).')
    if (datos.medicos.some((m) => m.colegiatura === cmp && m.id_medico !== id_medico)) {
      throw errorApi(409, `La colegiatura ${cmp} ya está registrada.`)
    }
    const campos = { nombres: nombres.trim(), apellidos: apellidos.trim(), colegiatura: cmp, id_especialidad: Number(id_especialidad) }
    let medico
    let clave = null
    if (id_medico) {
      medico = datos.medicos.find((m) => m.id_medico === id_medico)
      Object.assign(medico, campos)
    } else {
      medico = { id_medico: siguienteId(datos, 'medico'), ...campos, id_usuario: null }
      if (crear_usuario) {
        medico.id_usuario = crearUsuarioEn(datos, username, 'medico').id_usuario
        clave = claveTemporal()
      }
      datos.medicos.push(medico)
    }
    return { medico: medicoDe(datos, medico.id_medico), clave_temporal: clave }
  }),

  // PUT /admin/medicos/{id}/horario  → reemplaza los turnos de la semana
  guardarHorario: (idMedico, turnos) => escribir((datos) => {
    const limpios = turnos.map((t) => ({ ...t, hora_inicio: conSegundos(t.hora_inicio), hora_fin: conSegundos(t.hora_fin), duracion_cupo_min: Number(t.duracion_cupo_min) }))
    for (const t of limpios) {
      if (minutos(t.hora_fin) <= minutos(t.hora_inicio)) throw errorApi(422, 'La hora de fin debe ser posterior a la de inicio (ck_horario_rango).')
      if (!(t.duracion_cupo_min > 0)) throw errorApi(422, 'La duración del cupo debe ser mayor a 0.')
      if (minutos(t.hora_fin) - minutos(t.hora_inicio) < t.duracion_cupo_min) throw errorApi(422, 'Cada turno debe alcanzar para al menos un cupo.')
    }
    // Turnos del mismo día no pueden cruzarse
    for (const a of limpios) {
      for (const b of limpios) {
        if (a !== b && a.dia_semana === b.dia_semana && minutos(a.hora_inicio) < minutos(b.hora_fin) && minutos(b.hora_inicio) < minutos(a.hora_fin)) {
          throw errorApi(422, 'Hay turnos que se cruzan el mismo día.')
        }
      }
    }
    // No se deja sin horario a citas ya agendadas: primero se reprograman
    const fuera = citasPendientes(datos, idMedico).filter((c) => !limpios.some((t) => t.dia_semana === diaSemana(c.fecha)
      && minutos(c.hora) >= minutos(t.hora_inicio) && minutos(c.hora) + t.duracion_cupo_min <= minutos(t.hora_fin)))
    if (fuera.length) {
      throw errorApi(409, `Hay ${fuera.length} ${fuera.length === 1 ? 'cita agendada que queda' : 'citas agendadas que quedan'} fuera del nuevo horario. Reprográmalas en Agenda de citas antes de guardar.`)
    }
    datos.horarios = datos.horarios.filter((h) => h.id_medico !== idMedico)
      .concat(limpios.map((t) => ({ id_horario: siguienteId(datos, 'horario'), id_medico: idMedico, dia_semana: t.dia_semana, hora_inicio: t.hora_inicio, hora_fin: t.hora_fin, duracion_cupo_min: t.duracion_cupo_min })))
    return datos.horarios.filter((h) => h.id_medico === idMedico)
  }),

  // POST /admin/medicos/{id}/usuario → crea el acceso de un médico que aún no lo tiene
  crearUsuario: (idMedico, username) => escribir((datos) => {
    const medico = datos.medicos.find((m) => m.id_medico === idMedico)
    if (medico.id_usuario) throw errorApi(409, 'Este médico ya tiene usuario.')
    const usuario = crearUsuarioEn(datos, username, 'medico')
    medico.id_usuario = usuario.id_usuario
    return { usuario, clave_temporal: claveTemporal() }
  }),
}

export const usuariosAdminApi = {
  // GET /admin/usuarios?rol=enfermera
  listar: (rol) => leer((datos) => datos.usuarios.filter((u) => !rol || u.rol === rol)),

  // POST /admin/usuarios { username, rol }
  crear: ({ username, rol }) => escribir((datos) => ({ usuario: crearUsuarioEn(datos, username, rol), clave_temporal: claveTemporal() })),

  // PUT /admin/usuarios/{id}/activo  → no se borra: se activa o desactiva el acceso (usuario.activo)
  cambiarActivo: (idUsuario, activo) => escribir((datos) => {
    const u = buscarUsuario(datos, idUsuario)
    u.activo = activo
    return u
  }),

  // POST /admin/usuarios/{id}/restablecer-clave → contraseña temporal
  restablecerClave: (idUsuario) => escribir((datos) => {
    buscarUsuario(datos, idUsuario)
    return { clave_temporal: claveTemporal() }
  }),
}
