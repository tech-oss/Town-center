// Where a post on a business's page (or in any list of posts) opens.
//
// Most are News & Offers posts, at /news/:slug. A Featured Article is the
// longer editorial layout at /story/:slug — it carries its own `to` saying so.
// Building "/news/" + slug for everything sent a Featured Article to a news
// page that doesn't exist for it.
export function postPath(post, { mobile = false } = {}) {
  // A post that knows where it lives says so: a Featured Article at /story/,
  // an event at /event/. Only plain News & Offers posts fall through to
  // /news/, which is the one path that can be built from a slug alone.
  const own = post?.to;
  if (own && (own.startsWith("/story/") || own.startsWith("/event/"))) {
    return mobile ? `/mobile${own}` : own;
  }
  return mobile ? `/mobile/news/${post.slug}` : `/news/${post.slug}`;
}
