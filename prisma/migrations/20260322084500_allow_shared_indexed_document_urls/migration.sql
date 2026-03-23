-- DropIndex
DROP INDEX "IndexedDocument_url_key";

-- CreateIndex
CREATE INDEX "IndexedDocument_url_idx" ON "IndexedDocument"("url");
