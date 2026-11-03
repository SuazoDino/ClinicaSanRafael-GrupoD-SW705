# 4. Modelos UML

![Digrama de casos de uso](../assets/casos-uso/1.png)

## 4.1. Diagrama de casos de uso
* **Actores:** Recepcionista, Enfermera, Médico, Paciente y Mensajería (sistema externo).
* **Descripción:** 
  * Recepcionista: registra pacientes, agenda, reprograma o cancela citas y marca la asistencia.
  * Enfermera: registra el triaje.
  * Médico: ve su agenda del día, consulta la HCE unificada, registra el diagnóstico CIE-10 y la receta, y anula entradas con motivo.
  * Paciente: recibe el recordatorio 24 h antes (enviado por un servicio de mensajería externo).
* **Relaciones:** 
  * `<<include>>`: Registrar un paciente siempre valida DNI único; agendar una cita siempre consulta cupos libres; registrar diagnóstico siempre busca el código CIE-10.
  * `<<extend>>`: Imprimir la receta ocurre solo a veces, después de registrarla.
  * El inicio de sesión (JWT) y la bitácora son servicios transversales.

## 4.2. Diagrama de clases

![Diagrama de clases](../assets/diagrama-clases/1.png)

* **Entidades centrales:** `Usuario`, `Bitacora`, `Paciente`, `HistoriaClinica`, `Medico`, `Especialidad`, `Cita`, `ConsultaMedica`, `Triaje`, `Cie10`, `Diagnostico`, `Receta`, `Recordatorio`.
* **Descripción:** Un paciente tiene una sola HCE (1..1) y la HCE contiene muchas consultas (composición); una cita puede tener un triaje (0..1) y originar consultas (solo una vigente, las anuladas se conservan); cada consulta incluye uno o más diagnósticos codificados con CIE-10 y máximo una receta. `Usuario` y `Bitacora` respaldan RFN01 y RFN04.

## 4.3. Diagrama de actividades

![Diagrama de actividades](../assets/diagrama-actividades/1.png)

* **Proceso principal:** Agendar cita y atender consulta.
* **Decisiones clave:** ¿El DNI ya está registrado? (si no, registra paciente y crea HCE); ¿el cupo está libre? (si no, elige otro horario, la BD rechaza duplicados); ¿el paciente asistió? (si no, registra inasistencia).
