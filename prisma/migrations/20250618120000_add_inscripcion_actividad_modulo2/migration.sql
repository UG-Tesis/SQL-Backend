-- Nueva actividad DML: inscripción en practica_inscripciones (orden 3).
-- La actividad "Eliminar tu registro" pasa al orden 4.
-- Idempotente: seguro de re-ejecutar si la migración quedó a medias.

UPDATE `actividades`
SET `orden` = 4
WHERE `modulo_id` = 2
  AND `nombre` = 'Eliminar tu registro'
  AND `orden` <> 4;

INSERT INTO `actividades` (`modulo_id`, `nombre`, `descripcion`, `orden`, `activo`, `fecha_creacion`)
SELECT
  2,
  'Inscribirte en una materia',
  'Registra tu inscripción en practica_inscripciones vinculando tu alumno_id con una materia del curso.',
  3,
  true,
  CURRENT_TIMESTAMP
FROM DUAL
WHERE EXISTS (SELECT 1 FROM `modulos` WHERE `id` = 2)
  AND NOT EXISTS (
    SELECT 1
    FROM `actividades`
    WHERE `modulo_id` = 2
      AND `nombre` = 'Inscribirte en una materia'
  );

INSERT INTO `preguntas` (`actividad_id`, `pregunta`, `orden`)
SELECT
  a.id,
  'Escribe un INSERT INTO en la tabla practica_inscripciones para inscribirte en la materia Bases de Datos. Usa el alumno_id del registro que creaste en practica_alumnos (actividad anterior). Incluye las columnas alumno_id y materia. La fecha es opcional.',
  1
FROM `actividades` a
WHERE a.modulo_id = 2
  AND a.nombre = 'Inscribirte en una materia'
  AND NOT EXISTS (
    SELECT 1
    FROM `preguntas` p
    WHERE p.actividad_id = a.id
  );
