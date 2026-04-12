-- Composite index for listing top-level comments by post (postSlug + parentId IS NULL)
CREATE INDEX "Comment_postSlug_parentId_idx" ON "Comment"("postSlug", "parentId");

-- Supports ORDER BY "createdAt" DESC on guestbook lists
CREATE INDEX "GuestbookEntry_createdAt_idx" ON "GuestbookEntry"("createdAt" DESC);
