-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(191) NOT NULL,
    `referenciaId` INTEGER NULL,
    `mesaId` INTEGER NULL,
    `pedidoId` INTEGER NULL,
    `titulo` VARCHAR(191) NULL,
    `body` VARCHAR(191) NULL,
    `atendido` BOOLEAN NOT NULL DEFAULT false,
    `atendidoPorGarcomId` INTEGER NULL,
    `atendidoEm` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estabelecimentoId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Avaliacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estrelas` INTEGER NOT NULL,
    `comentario` TEXT NULL,
    `mesaId` INTEGER NULL,
    `pedidoId` INTEGER NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estabelecimentoId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
