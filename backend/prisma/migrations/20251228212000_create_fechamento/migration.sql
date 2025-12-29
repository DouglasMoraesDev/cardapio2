-- CreateTable
CREATE TABLE `Fechamento` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `estabelecimentoId` INTEGER NOT NULL,
  `fechadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Fechamento_estabelecimentoId_idx` (`estabelecimentoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Fechamento` ADD CONSTRAINT `Fechamento_estabelecimentoId_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `Estabelecimento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
