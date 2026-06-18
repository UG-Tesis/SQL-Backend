-- Nueva actividad DML: inscripción en practica_inscripciones (orden 3).
-- La actividad "Eliminar tu registro" pasa al orden 4.

UPDATE `actividades`
SET `orden` = 4
WHERE `modulo_id` = 2 AND `nombre` = 'Eliminar tu registro';

INSERT INTO `actividades` (`modulo_id`, `nombre`, `descripcion`, `orden`, `activo`, `fecha_creacion`)
VALUES (
  2,
  'Inscribirte en una materia',
  'Registra tu inscripción en practica_inscripciones vinculando tu alumno_id con una materia del curso.',
  3,
  true,
  CURRENT_TIMESTAMP
);

INSERT INTO `preguntas` (`actividad_id`, `pregunta`, `orden`)
VALUES (
  LAST_INSERT_ID(),
  'Escribe un INSERT INTO en la tabla practica_inscripciones para inscribirte en la materia Bases de Datos. Usa el alumno_id del registro que creaste en practica_alumnos (actividad anterior). Incluye las columnas alumno_id y materia. La fecha es opcional.',
  1
);
