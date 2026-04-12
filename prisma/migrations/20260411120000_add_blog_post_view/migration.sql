-- CreateTable
CREATE TABLE "BlogPostView" (
    "postSlug" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BlogPostView_pkey" PRIMARY KEY ("postSlug")
);
