import { useNavigate } from "react-router-dom";
import { hasInAppHistory } from "../lib/navHistory";

// Back button behaviour shared by every mobile screen: step back through
// this session's in-app history when there is any, otherwise land on a
// screen-specific fallback so the button always does something useful
// instead of exiting the app or sitting there inert.
export default function useMobileBack(fallback = "/mobile/home") {
  const navigate = useNavigate();
  return () => {
    if (hasInAppHistory()) navigate(-1);
    else navigate(fallback, { replace: true });
  };
}
