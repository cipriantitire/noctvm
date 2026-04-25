import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="NoctvmDemo"
      component={MyComposition}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        title: "NOCTVM",
        subtitle: "The living memory of the night",
      }}
    />
  );
};
