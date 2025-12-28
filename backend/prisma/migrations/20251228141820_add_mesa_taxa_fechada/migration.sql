-- AlterTable
ALTER TABLE `Estabelecimento` ADD COLUMN `tema_cor_destaque` VARCHAR(20) NULL,
    ADD COLUMN `tema_cor_primaria` VARCHAR(20) NULL,
    ADD COLUMN `tema_cor_texto` VARCHAR(20) NULL,
    ADD COLUMN `tema_fundo_cartoes` VARCHAR(20) NULL,
    ADD COLUMN `tema_fundo_geral` VARCHAR(20) NULL;

-- AlterTable
ALTER TABLE `Mesa` ADD COLUMN `fechadaEm` DATETIME(3) NULL,
    ADD COLUMN `taxaPaga` BOOLEAN NOT NULL DEFAULT false;
