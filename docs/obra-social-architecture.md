# Gestión de Obra Social en CareLink

## Decisión de Arquitectura

### Problema Identificado
Durante el desarrollo inicial se incluyeron campos de obra social (`obraSocialId`, `numeroAfiliado`) en el modelo `Patient`, lo cual no refleja correctamente el flujo de trabajo médico real.

### Solución Implementada
**Los campos de obra social se han removido del modelo `Patient` y se manejarán a nivel de `Appointment` (turnos).**

## Justificación

### ¿Por qué no en Patient?
1. **Flexibilidad**: Un paciente puede tener diferentes obras sociales a lo largo del tiempo
2. **Privacidad**: No todos los turnos requieren obra social (consultas particulares)
3. **Flujo real**: La obra social se define al momento de solicitar el turno, no al registrar al paciente
4. **Cambios**: Las obras sociales pueden cambiar, vencerse, o el paciente puede optar por atención particular

### ¿Por qué en Appointment?
1. **Contexto correcto**: La obra social es relevante para una consulta específica
2. **Flexibilidad de pago**: Cada turno puede tener diferente modalidad (obra social/particular)
3. **Auditoría**: Permite rastrear qué obra social se usó en cada consulta
4. **Facturación**: Los datos están donde se necesitan para generar facturas

## Implementación Futura

### Campos planificados para el modelo Appointment:
- `obraSocialId`: Referencia a la obra social usada en este turno
- `numeroAfiliado`: Número de afiliado al momento del turno
- `tipoConsulta`: "Obra Social", "Particular", "Mutual", etc.
- `copago`: Monto que debe abonar el paciente
- `autorizacion`: Número de autorización previa si es requerida

### Workflow propuesto:
1. **Registro de Paciente**: Solo datos personales y de contacto
2. **Solicitud de Turno**: Se especifica obra social y modalidad de pago
3. **Confirmación**: Se valida la vigencia de la obra social
4. **Consulta**: Se factura según la modalidad elegida

## Beneficios de esta Arquitectura

### Para Mesa de Entrada:
- Registro más rápido de pacientes
- Flexibilidad al agendar turnos
- Menos datos obligatorios en el alta

### Para Facturación:
- Datos precisos por consulta
- Histórico de obras sociales usadas
- Facilita la generación de liquidaciones

### Para Auditoría:
- Trazabilidad completa de pagos
- Historial de cambios de obra social
- Separación clara entre datos del paciente y datos del turno

## Estado Actual
- ✅ Campos removidos del modelo Patient
- ✅ Migración de base de datos completada
- ✅ API y formularios actualizados
- ✅ Validaciones corregidas
- ⏳ Implementación en modelo Appointment (pendiente)

---
*Documento actualizado: 24 de septiembre de 2024*