import TextScreen from "../components/TextScreen";

// Site Content → Our Traders, the same as the website's /traders.
export default function TradersScreen() {
  return <TextScreen sectionKey="traders" barTitle="Our Traders" highlight={/^\s*while we are proud/i} />;
}
