-- CreateTable
CREATE TABLE `actividades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `modulo_id` INTEGER NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NULL,
    `orden` INTEGER NOT NULL DEFAULT 1,
    `activo` BOOLEAN NULL DEFAULT true,
    `fecha_creacion` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `modulo_id`(`modulo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avance_actividad` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `inscripcion_id` INTEGER NOT NULL,
    `actividad_id` INTEGER NOT NULL,
    `finalizado` BOOLEAN NULL DEFAULT false,
    `total_preguntas` INTEGER NULL DEFAULT 0,
    `preguntas_respondidas` INTEGER NULL DEFAULT 0,
    `porcentaje` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `fecha_inicio` TIMESTAMP(0) NULL,
    `fecha_finalizacion` TIMESTAMP(0) NULL,

    INDEX `actividad_id`(`actividad_id`),
    UNIQUE INDEX `unico_avance`(`inscripcion_id`, `actividad_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cursos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NULL,
    `duracion_horas` INTEGER NULL,
    `activo` BOOLEAN NULL DEFAULT true,
    `fecha_creacion` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inscripciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `persona_id` INTEGER NOT NULL,
    `curso_id` INTEGER NOT NULL,
    `fecha_inscripcion` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `fecha_completado` TIMESTAMP(0) NULL,
    `estado` ENUM('activo', 'completado', 'abandonado') NULL DEFAULT 'activo',
    `porcentaje_avance` DECIMAL(5, 2) NULL DEFAULT 0.00,

    INDEX `curso_id`(`curso_id`),
    UNIQUE INDEX `unica_inscripcion`(`persona_id`, `curso_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modulo_estado` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `inscripcion_id` INTEGER NOT NULL,
    `modulo_id` INTEGER NOT NULL,
    `finalizado` BOOLEAN NULL DEFAULT false,
    `porcentaje` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `fecha_inicio` TIMESTAMP(0) NULL,
    `fecha_finalizacion` TIMESTAMP(0) NULL,

    INDEX `modulo_id`(`modulo_id`),
    UNIQUE INDEX `unico_modulo_estado`(`inscripcion_id`, `modulo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modulos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `curso_id` INTEGER NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NULL,
    `orden` INTEGER NOT NULL,
    `duracion_horas` INTEGER NULL,

    INDEX `curso_id`(`curso_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `personas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cedula` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NULL,
    `telefono` VARCHAR(20) NULL,
    `fecha_registro` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `cedula`(`cedula`),
    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `preguntas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actividad_id` INTEGER NOT NULL,
    `pregunta` TEXT NOT NULL,
    `orden` INTEGER NOT NULL DEFAULT 1,

    INDEX `actividad_id`(`actividad_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `progreso_modulos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `inscripcion_id` INTEGER NOT NULL,
    `modulo_id` INTEGER NOT NULL,
    `modulo_estado_id` INTEGER NULL,
    `estado` ENUM('pendiente', 'en_progreso', 'completado') NULL DEFAULT 'pendiente',
    `porcentaje` INTEGER NULL DEFAULT 0,
    `fecha_inicio` TIMESTAMP(0) NULL,
    `fecha_completado` TIMESTAMP(0) NULL,

    INDEX `modulo_estado_id`(`modulo_estado_id`),
    INDEX `modulo_id`(`modulo_id`),
    UNIQUE INDEX `unico_progreso`(`inscripcion_id`, `modulo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `actividades` ADD CONSTRAINT `actividades_ibfk_1` FOREIGN KEY (`modulo_id`) REFERENCES `modulos`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `avance_actividad` ADD CONSTRAINT `avance_actividad_ibfk_1` FOREIGN KEY (`inscripcion_id`) REFERENCES `inscripciones`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `avance_actividad` ADD CONSTRAINT `avance_actividad_ibfk_2` FOREIGN KEY (`actividad_id`) REFERENCES `actividades`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `inscripciones` ADD CONSTRAINT `inscripciones_ibfk_1` FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `inscripciones` ADD CONSTRAINT `inscripciones_ibfk_2` FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `modulo_estado` ADD CONSTRAINT `modulo_estado_ibfk_1` FOREIGN KEY (`inscripcion_id`) REFERENCES `inscripciones`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `modulo_estado` ADD CONSTRAINT `modulo_estado_ibfk_2` FOREIGN KEY (`modulo_id`) REFERENCES `modulos`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `modulos` ADD CONSTRAINT `modulos_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `preguntas` ADD CONSTRAINT `preguntas_ibfk_1` FOREIGN KEY (`actividad_id`) REFERENCES `actividades`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `progreso_modulos` ADD CONSTRAINT `progreso_modulos_ibfk_1` FOREIGN KEY (`inscripcion_id`) REFERENCES `inscripciones`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `progreso_modulos` ADD CONSTRAINT `progreso_modulos_ibfk_2` FOREIGN KEY (`modulo_id`) REFERENCES `modulos`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `progreso_modulos` ADD CONSTRAINT `progreso_modulos_ibfk_3` FOREIGN KEY (`modulo_estado_id`) REFERENCES `modulo_estado`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
