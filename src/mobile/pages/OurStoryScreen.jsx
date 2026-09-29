import TextScreen from "../components/TextScreen";

// Site Content → About / Our Story, the same as the website's /about.
export default function OurStoryScreen() {
  return <TextScreen sectionKey="about" barTitle="Our Story" highlight={/not affiliated/i} />;
}
