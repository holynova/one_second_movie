export type Frame = { time: number; url: string; color: string };
export function sampleTimes(
  duration: number,
  count: number,
  start = 0,
  end = duration,
) {
  if (
    !Number.isFinite(duration) ||
    duration <= 0 ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 120 ||
    start < 0 ||
    end > duration ||
    end <= start
  )
    throw new Error("请选择有效的时间范围。");
  return Array.from(
    { length: count },
    (_, i) => start + ((end - start) * (i + 0.5)) / count,
  );
}
export function timecode(value: number) {
  const s = Math.floor(value);
  return `${Math.floor(s / 3600) ? String(Math.floor(s / 3600)).padStart(2, "0") + ":" : ""}${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function event(
  video: HTMLVideoElement,
  type: string,
  signal: AbortSignal,
  action: () => void,
) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("已取消", "AbortError"));
      return;
    }
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener(type, done);
      video.removeEventListener("error", fail);
      signal.removeEventListener("abort", cancel);
    };
    const done = () => {
        cleanup();
        resolve();
      },
      fail = () => {
        cleanup();
        reject(
          new Error(
            "视频无法解码，或远程链接不允许跨域读取。请尝试本地 MP4 / WebM。",
          ),
        );
      },
      cancel = () => {
        cleanup();
        reject(new DOMException("已取消", "AbortError"));
      };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("视频读取超时，请更换视频或缩小抽帧范围。"));
    }, 15000);
    video.addEventListener(type, done, { once: true });
    video.addEventListener("error", fail, { once: true });
    signal.addEventListener("abort", cancel, { once: true });
    action();
  });
}
export async function metadata(source: string, signal: AbortSignal) {
  const v = document.createElement("video");
  v.muted = true;
  v.preload = "auto";
  v.crossOrigin = "anonymous";
  try {
    await event(v, "loadedmetadata", signal, () => {
      v.src = source;
      v.load();
    });
    if (!Number.isFinite(v.duration) || v.duration <= 0)
      throw new Error("无法读取视频时长，请使用有完整时长信息的 MP4 或 WebM。");
    return { duration: v.duration, width: v.videoWidth, height: v.videoHeight };
  } finally {
    v.removeAttribute("src");
    v.load();
  }
}
export async function extract(
  source: string,
  times: number[],
  signal: AbortSignal,
  onProgress: (value: number) => void,
): Promise<Frame[]> {
  const v = document.createElement("video");
  v.muted = true;
  v.preload = "auto";
  v.crossOrigin = "anonymous";
  v.playsInline = true;
  const frames: Frame[] = [];
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 270;
  const ctx = canvas.getContext("2d")!;
  const avg = document.createElement("canvas");
  avg.width = avg.height = 1;
  const ac = avg.getContext("2d", { willReadFrequently: true })!;
  try {
    await event(v, "loadeddata", signal, () => {
      v.src = source;
      v.load();
    });
    for (const time of times) {
      if (signal.aborted) throw new DOMException("已取消", "AbortError");
      if (Math.abs(v.currentTime - time) > 0.001)
        await event(v, "seeked", signal, () => {
          v.currentTime = time;
        });
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, 480, 270);
      const scale = Math.min(480 / v.videoWidth, 270 / v.videoHeight);
      const w = v.videoWidth * scale,
        h = v.videoHeight * scale;
      ctx.drawImage(v, (480 - w) / 2, (270 - h) / 2, w, h);
      ac.drawImage(v, 0, 0, 1, 1);
      const [r, g, b] = ac.getImageData(0, 0, 1, 1).data;
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("无法生成缩略图"))),
          "image/jpeg",
          0.85,
        ),
      );
      frames.push({
        time,
        url: URL.createObjectURL(blob),
        color: `rgb(${r},${g},${b})`,
      });
      onProgress(Math.round((frames.length / times.length) * 100));
      await new Promise((r) => setTimeout(r, 0));
    }
    return frames;
  } catch (e) {
    frames.forEach((f) => URL.revokeObjectURL(f.url));
    throw e;
  } finally {
    v.pause();
    v.removeAttribute("src");
    v.load();
    canvas.width = canvas.height = avg.width = avg.height = 0;
  }
}
export async function poster(
  frames: Frame[],
  title: string,
  mode: "sheet" | "color",
  columns: number,
) {
  const width = 2400,
    pad = 100,
    gap = 16,
    cell = (width - 2 * pad - gap * (columns - 1)) / columns,
    frameH = (cell * 9) / 16;
  const height =
    mode === "color"
      ? 1200
      : Math.ceil(
          240 + Math.ceil(frames.length / columns) * (frameH + 48 + gap) + 100,
        );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#101310";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#e8e8da";
  ctx.font = "48px sans-serif";
  ctx.fillText(title.slice(0, 60), pad, 105, width - 2 * pad);
  ctx.fillStyle = "#9b9e8f";
  ctx.font = "20px monospace";
  ctx.fillText(
    `ONE SECOND MOVIE / ${frames.length} FRAMES / ${mode === "sheet" ? "CONTACT SHEET" : "COLOR SCRIPT"}`,
    pad,
    150,
  );
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (mode === "color") {
      ctx.fillStyle = f.color;
      ctx.fillRect(
        pad + (i * (width - 2 * pad)) / frames.length,
        230,
        Math.ceil((width - 2 * pad) / frames.length),
        700,
      );
    } else {
      const image = new Image();
      image.src = f.url;
      await image.decode();
      const x = pad + (i % columns) * (cell + gap),
        y = 220 + Math.floor(i / columns) * (frameH + 48 + gap);
      ctx.drawImage(image, x, y, cell, frameH);
      ctx.fillStyle = "#b4b8a5";
      ctx.font = "18px monospace";
      ctx.fillText(timecode(f.time), x, y + frameH + 30);
    }
  }
  ctx.fillStyle = "#9b9e8f";
  ctx.font = "18px monospace";
  ctx.fillText("A FILM, SEEN ALL AT ONCE.", pad, height - 45);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("海报导出失败"))),
      "image/png",
    ),
  );
  canvas.width = canvas.height = 0;
  return blob;
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
