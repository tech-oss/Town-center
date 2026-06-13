import { Link } from "react-router-dom";

// Renders a react-router <Link> for internal routes ("/..." — including those
// with a #hash) and a plain <a> for external URLs, mailto:, tel: and bare
// "#" anchors. Lets section components stay declarative without repeating the
// internal-vs-external branch everywhere.
export default function SmartLink({ to, href, children, ...rest }) {
  const target = to ?? href ?? "#";
  const isInternal = target.startsWith("/");
  if (isInternal) {
    return (
      <Link to={target} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={target} {...rest}>
      {children}
    </a>
  );
}
