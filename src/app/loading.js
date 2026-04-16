import { FullScreenLoader } from "../components/loaders";

export default function GlobalLoading() {
  return (
    <FullScreenLoader
      eyebrow="Routing"
      title="Loading the next view"
      description="Bringing in the next screen with your latest data."
    />
  );
}
