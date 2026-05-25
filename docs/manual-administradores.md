# Manual de uso para administradores

## ¿Qué es ULA-SIRE?

ULA-SIRE es un sistema de gestión académica para organizar la estructura institucional y los procesos académicos de la universidad. Desde el panel administrativo se pueden registrar facultades, escuelas, departamentos, salones, carreras, opciones de carrera, materias, pensums, profesores, estudiantes, períodos académicos, ventanas de inscripción, secciones y horarios.

Este manual está dirigido únicamente a usuarios con rol de administrador.

## Acceso al sistema

1. Abra el sistema en el navegador.
2. Ingrese a la pantalla de inicio de sesión.
3. Seleccione el tipo de acceso:
   - `Email`: use el correo institucional registrado.
   - `C.I.`: use la cédula o identificador institucional registrado.
4. Escriba la contraseña.
5. Presione `Iniciar sesión`.

Si las credenciales son correctas, el sistema redirige al panel correspondiente. Para usuarios administradores, el destino es el panel administrativo.

## Panel administrativo

El panel administrativo permite navegar por los siguientes módulos:

- `Dashboard`: resumen general y accesos rápidos.
- `Estudiantes`: registro y consulta de estudiantes.
- `Profesores`: registro y consulta de docentes.
- `Facultades`: gestión de facultades, escuelas, departamentos y salones.
- `Pensums`: creación y consulta de pensums por carrera y opción.
- `Materias`: catálogo de materias por departamento.
- `Períodos`: períodos académicos, ofertas, secciones, horarios e inscripción.
- `Reclamos`: módulo para seguimiento de reclamos.
- `Configuración`: opciones de cuenta o configuración disponible.

## Orden recomendado de configuración

Para cargar información académica desde cero, siga este orden:

1. Crear la facultad.
2. Crear escuelas, departamentos y salones dentro de la facultad.
3. Entrar al detalle de cada escuela y crear carreras.
4. Crear opciones dentro de cada carrera.
5. Crear materias asociadas a departamentos.
6. Crear profesores y asociarlos a departamentos.
7. Crear pensums asociados a opciones de carrera.
8. Crear períodos académicos con oferta o crear el período y luego agregar secciones.
9. Registrar estudiantes admitidos, asociándolos a período, carrera/opción y pensum.

Este orden evita que falten datos en los selectores del sistema.

## Crear una facultad

1. Entre a `Facultades`.
2. En el formulario de registro, complete:
   - `Código`: identificador corto. Ejemplo: `FING`.
   - `Nombre`: nombre completo de la facultad.
   - `Descripción`: información opcional.
3. Presione `Crear facultad` o `Guardar`.
4. Verifique que la facultad aparezca en la lista.

Desde la lista puede editar, eliminar o abrir el detalle de la facultad. Si la facultad tiene datos relacionados, la eliminación puede ser rechazada por el sistema.

## Crear escuelas, departamentos y salones

1. Entre a `Facultades`.
2. Abra el detalle de la facultad correspondiente.
3. Use el selector del formulario para escoger qué desea crear:
   - `Escuelas`
   - `Departamentos`
   - `Salones`
4. Complete los campos requeridos.

Para escuelas y departamentos:

- `Código`
- `Nombre`
- `Descripción` opcional

Para salones:

- `Código`
- `Edificio` opcional
- `Aula` opcional
- `Capacidad` opcional

5. Presione `Crear`.

Las escuelas se usan para crear carreras. Los departamentos se usan para crear materias y asociar profesores. Los salones se usan al configurar horarios de secciones.

## Crear una carrera

1. Entre a `Facultades`.
2. Abra el detalle de la facultad.
3. En la sección `Escuelas`, abra el detalle de la escuela.
4. En el formulario `Crear carrera u opción`, seleccione `Carrera`.
5. Complete:
   - `Código`
   - `Nombre`
   - `Descripción` opcional
6. Presione `Guardar`.

## Crear una opción de carrera

1. Entre al detalle de la escuela correspondiente.
2. En `Crear carrera u opción`, seleccione `Opción`.
3. Seleccione la carrera.
4. Complete:
   - `Código`
   - `Nombre`
   - `Descripción` opcional
5. Presione `Guardar`.

Primero debe existir una carrera para poder registrar sus opciones.

## Crear departamentos

Los departamentos se crean desde el detalle de una facultad:

1. Entre a `Facultades`.
2. Abra la facultad.
3. Seleccione `Departamentos` en el formulario.
4. Complete `Código`, `Nombre` y, si aplica, `Descripción`.
5. Presione `Crear`.

Después de crear departamentos, podrá usarlos en `Materias` y `Profesores`.

## Crear materias

1. Entre a `Materias`.
2. En `Crear materia`, seleccione el departamento responsable.
3. Complete:
   - `Código`: ejemplo `INF101`.
   - `Nombre`: ejemplo `Programación I`.
   - `Créditos`.
   - `Horas semanales` opcional.
   - `Descripción` opcional.
   - `Activa`: deje marcada la casilla si la materia puede usarse en ofertas académicas.
4. Presione `Guardar`.

Las materias activas estarán disponibles al crear ofertas y secciones de períodos académicos.

## Crear profesores

1. Entre a `Profesores`.
2. En `Crear profesor`, complete:
   - `Nombre`
   - `Email`
   - `C.I. / ID`
   - `Clave inicial`
   - `Código empleado`
   - `Departamento` opcional
   - `Teléfono` opcional
   - `Título académico` opcional
   - `Oficina` opcional
3. Presione `Guardar`.

El sistema crea el usuario docente y su perfil académico. Si el profesor será asignado a secciones, conviene asociarlo al departamento correspondiente.

## Crear un pensum

1. Entre a `Pensums`.
2. En `Crear pensum`, seleccione la `Opción de carrera`.
3. Complete:
   - `Código`: ejemplo `SIS-2026`.
   - `Nombre`: ejemplo `Pensum 2026`.
   - `Versión`: número de versión.
   - `Estado`: `Borrador`, `Activo` o `Archivado`.
   - `Créditos totales` opcional.
   - `Vigente desde` opcional, si ya existe un período académico.
4. Presione `Guardar`.
5. Verifique el registro en la tabla de pensums.
6. Abra el detalle para consultar materias, créditos, grupos electivos, vigencia y estudiantes asociados.

Nota: en la interfaz actual, el detalle del pensum muestra materias y grupos electivos cuando existen, pero la pantalla administrativa visible no incluye un formulario para agregarlos manualmente al pensum. Si un pensum requiere materias cargadas, deben existir por carga inicial, migración, seed o una funcionalidad adicional.

## Crear un período académico con oferta

1. Entre a `Períodos`.
2. En `Crear período con oferta académica`, complete:
   - `Código`: ejemplo `2026-1`.
   - `Año`.
   - `Período`: primera mitad, segunda mitad o verano.
   - `Inicio académico`.
   - `Fin académico`.
   - `Estado`: planificado, activo o cerrado.
   - `Facultad`.
   - `Nombre de inscripción`.
   - `Inicio inscripción`.
   - `Fin inscripción`.
3. En `Materias ofertadas`, agregue cada sección:
   - `Materia`
   - `Sección`
   - `Profesor` opcional
   - `Modalidad`
   - `Cupos`
4. En `Horarios`, seleccione:
   - `Día`
   - `Salón`
   - `Inicio`
   - `Fin`
5. Use `Agregar día` si la misma sección tiene varios horarios.
6. Use `Agregar materia` si necesita ofertar más secciones.
7. Presione `Crear período y oferta`.

Al seleccionar una facultad, el sistema filtra materias, profesores y salones disponibles para esa facultad.

## Editar un período o agregar secciones después

1. Entre a `Períodos`.
2. En la tabla, presione `Ver` sobre el período.
3. En `Datos del período`, modifique código, año, tipo de período, fechas o estado.
4. Presione `Guardar`.
5. En `Agregar materia y sección`, registre nuevas secciones con materia, profesor, modalidad, estado, cupos y horarios.
6. Presione `Agregar sección`.

En la tabla `Materias y secciones` puede editar o eliminar secciones existentes.

## Registrar estudiantes admitidos

1. Entre a `Estudiantes`.
2. En `Registrar admitido`, complete:
   - `Nombre`
   - `Email`
   - `C.I. / ID`
   - `Código estudiante`
   - `C.I. nacional` opcional
   - `Fecha nacimiento` opcional
   - `Teléfono` opcional
   - `Período de inicio`
   - `Carrera / opción`
   - `Pensum activo`
   - `Dirección` opcional
3. Presione `Registrar`.
4. Revise el comprobante generado.
5. Use `Exportar PDF` si necesita entregar el comprobante de acceso.

El sistema crea el usuario estudiantil, asigna el pensum seleccionado y genera una clave temporal.

## Recomendaciones administrativas

- Use códigos cortos, consistentes y sin duplicados.
- Cree primero la estructura académica antes de registrar materias, pensums o períodos.
- Revise que las materias estén activas antes de ofertarlas en un período.
- Verifique fechas de inicio y fin antes de activar períodos o ventanas de inscripción.
- No elimine registros que ya tengan estudiantes, secciones, pensums o historial asociado.
- Mantenga las contraseñas iniciales en un canal seguro y solicite cambio al usuario cuando corresponda.

