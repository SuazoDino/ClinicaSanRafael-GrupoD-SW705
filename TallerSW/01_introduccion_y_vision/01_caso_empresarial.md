# 0. Caso empresarial: Clínica San Rafael S.A.C.

Clínica privada de salud en San Borja, Lima, que ofrece consulta ambulatoria multiespecialidad, laboratorio, imágenes, farmacia, hospitalización, emergencia y cirugía ambulatoria. Gestiona historias clínicas en papel/Excel por especialidad, agenda telefónica saturada (18% de inasistencia), resultados de laboratorio en papel (hasta 48 h de demora) y reconciliación manual con 5 EPS y aseguradoras.

## 0.1. Alcance funcional por módulos (dado)
| Módulo | Alcance funcional | Prioridad |
| :--- | :--- | :--- |
| **M1. Historia clínica electrónica (HCE)** | Registro unificado del paciente: antecedentes, consultas, diagnósticos (CIE-10), indicaciones y recetas | Sprint 1 (imprescindible) |
| **M2. Agenda y citas médicas** | Programación por especialidad y médico, confirmación/recordatorio, reprogramación, disponibilidad consolidada | Sprint 1 (imprescindible) |
| **M3. Laboratorio e imágenes** | Registro de órdenes médicas y resultados digitales | Sprint 2 (imprescindible) |
| **M4. Facturación y convenios** | Comprobantes, tarifario por convenio (particular/EPS/SOAT), copagos y glosas | Sprint 2 (imprescindible) |
| **M5. Reportes gerenciales** | Ocupación de consultorios, tiempos de espera, ingresos, inasistencia | Sprint 2 (imprescindible) |
| **M6. Portal del paciente / telemedicina** | Agendamiento en línea y consulta virtual básica | Sprint 2 (deseable) |

## 0.2. Requerimientos no funcionales mínimos (dados)
| RNF | Descripción |
| :--- | :--- |
| **Seguridad** | Acceso a la HCE restringido por rol y registrado en bitácora de auditoría (Ley N.° 29733) |
| **Disponibilidad** | Módulos de emergencia y agenda disponibles en horario de atención de la clínica |
| **Rendimiento** | Apertura de la historia clínica en menos de 2 segundos, con hasta 8 000 pacientes |
| **Trazabilidad** | Ninguna entrada de historia clínica se elimina físicamente; solo se anula con motivo |
| **Usabilidad** | Interfaz simple para personal con distintos niveles de alfabetización digital |

## 0.3. Restricciones (dadas)
* Presupuesto de infraestructura acotado: hosting o nube de costo moderado.
* Toda prueba o demostración usa datos ficticios o anonimizados; nunca datos reales de pacientes.
* El equipo define y justifica el stack tecnológico en el documento de arquitectura.
