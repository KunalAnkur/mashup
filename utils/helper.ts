import { ControlComponents } from "@/components/VideoPlayer/Player";
import { SourceProps } from "react-player/base";

export function getPlayerControlsConfig(url: string | string[] | SourceProps[] | MediaStream, host: boolean) {
    if (host) {
        return {
          disableControls: [],
          hideControls: [],
        };
    }

    if (typeof url === "string") {
      // url is a single string
      return {
        disableControls: [ControlComponents.PLAY, ControlComponents.PROGRESS],
        hideControls: [],
      };
    } else if (Array.isArray(url) && url.length && typeof url[0] === "string") {
      // url is string[]
      return {
        disableControls: [],
        hideControls: [],
      };
    } else if (Array.isArray(url) && url.length && typeof url[0] === "object") {
      // url is SourceProps[]
      return {
        disableControls: [],
        hideControls: [],
      };
    } else if (
      typeof MediaStream !== "undefined" &&
      url instanceof MediaStream
    ) {
      // url is MediaStream
      return {
        disableControls: [ControlComponents.PLAY],
        hideControls: [
          ControlComponents.PLAY,
          ControlComponents.PROGRESS,
          ControlComponents.DURATION,
        ],
      };
    }
    return {
      disableControls: [],
      hideControls: [
        ControlComponents.PLAY,
        ControlComponents.PROGRESS,
        ControlComponents.OVERLAY,
        ControlComponents.DURATION,
      ],
    };
    
}
