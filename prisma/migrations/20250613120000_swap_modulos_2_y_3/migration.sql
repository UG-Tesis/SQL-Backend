-- Intercambiar orden de módulos 2 (DML) y 3 (DQL básico) en el curso
UPDATE `modulos` SET `orden` = 99 WHERE `id` = 2;
UPDATE `modulos` SET `orden` = 3 WHERE `id` = 3;
UPDATE `modulos` SET `orden` = 2 WHERE `id` = 2;
