import { useEffect, useRef, useState } from "react";
import {
  metadata,
  extract,
  sampleTimes,
  timecode,
  poster,
  download,
  type Frame,
} from "./lib/video";
import "./App.css";
const palettes = [
  "#233b3d",
  "#2b4847",
  "#395952",
  "#526c59",
  "#878564",
  "#b5a376",
  "#d2b78b",
  "#bf9571",
  "#94765e",
  "#615e52",
  "#3d514c",
  "#213c41",
];
export default function App() {
  const [source, setSource] = useState(""),
    [name, setName] = useState(""),
    [meta, setMeta] = useState({ duration: 0, width: 0, height: 0 }),
    [frames, setFrames] = useState<Frame[]>([]),
    [mode, setMode] = useState<"sheet" | "color">("sheet"),
    [count, setCount] = useState(48),
    [columns, setColumns] = useState(4),
    [start, setStart] = useState(0),
    [end, setEnd] = useState(0),
    [busy, setBusy] = useState(""),
    [progress, setProgress] = useState(0),
    [error, setError] = useState(""),
    [url, setUrl] = useState(""),
    [remote, setRemote] = useState(false),
    [active, setActive] = useState(0),
    [zoom, setZoom] = useState(1);
  const input = useRef<HTMLInputElement>(null),
    video = useRef<HTMLVideoElement>(null),
    controller = useRef<AbortController | null>(null),
    current = useRef({ source, frames });
  current.current = { source, frames };
  useEffect(
    () => () => {
      controller.current?.abort();
      if (current.current.source.startsWith("blob:"))
        URL.revokeObjectURL(current.current.source);
      current.current.frames.forEach((f) => URL.revokeObjectURL(f.url));
    },
    [],
  );
  function clear() {
    setFrames((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.url));
      return [];
    });
    setActive(0);
  }
  async function load(src: string, title: string) {
    if (busy) return;
    setBusy("正在读取视频");
    setError("");
    const c = new AbortController();
    controller.current = c;
    try {
      const m = await metadata(src, c.signal);
      if (source.startsWith("blob:")) URL.revokeObjectURL(source);
      clear();
      setSource(src);
      setName(title);
      setMeta(m);
      setStart(0);
      setEnd(Math.floor(m.duration * 1000) / 1000);
    } catch (e) {
      if (src.startsWith("blob:")) URL.revokeObjectURL(src);
      setError(c.signal.aborted ? "已取消读取。" : (e as Error).message);
    } finally {
      setBusy("");
      controller.current = null;
      if (input.current) input.current.value = "";
    }
  }
  function file(f?: File) {
    if (!f || busy) return;
    if (
      !f.type.startsWith("video/") &&
      !/\.(mp4|webm|mov|m4v)$/i.test(f.name)
    ) {
      setError("请选择视频文件。");
      return;
    }
    load(URL.createObjectURL(f), f.name.replace(/\.[^.]+$/, ""));
  }
  async function generate() {
    setError("");
    const c = new AbortController();
    controller.current = c;
    try {
      const times = sampleTimes(meta.duration, count, start, end);
      setBusy("正在逐帧读取");
      setProgress(0);
      const next = await extract(source, times, c.signal, setProgress);
      clear();
      setFrames(next);
    } catch (e) {
      setError(
        c.signal.aborted
          ? "抽帧已取消，已有结果仍然保留。"
          : (e as Error).message,
      );
    } finally {
      setBusy("");
      controller.current = null;
    }
  }
  function seek(i: number) {
    setActive(i);
    if (video.current) video.current.currentTime = frames[i].time;
  }
  async function save() {
    setBusy("正在生成海报");
    try {
      download(
        await poster(frames, name, mode, columns),
        `${name}-${mode}.png`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="app">
      <header>
        <a className="logo" href="./">
          <span className="logo-mark">◧</span> ONE SECOND MOVIE
          <span className="version">/ 02</span>
        </a>
        <a
          href="https://github.com/holynova/one_second_movie"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </header>
      <main>
        <section className="hero">
          <div>
            <div className="eyebrow">THE WHOLE STORY. A SINGLE FRAME.</div>
            <h1>
              一眼，<em>看完整部电影。</em>
            </h1>
            <p>把时间铺成画面，把故事留成色彩。你的影片，也有另一种看法。</p>
          </div>
          <div className="hero-index">
            FRAME BY FRAME
            <br />
            <b>影片视觉地图</b>
          </div>
        </section>
        <div className="workspace">
          <aside>
            <div className="step">
              01 <span>选择影片</span>
            </div>
            <input
              ref={input}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => file(e.target.files?.[0])}
            />
            <button
              className="drop"
              disabled={!!busy}
              onClick={() => input.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                file(e.dataTransfer.files[0]);
              }}
            >
              <span className="plus">＋</span>
              <strong>{name || "放入一部影片"}</strong>
              <small>{source ? "点击更换视频" : "拖入文件，或点击选择"}</small>
              <span className="filetypes">MP4 / WEBM / MOV</span>
            </button>
            <div className="source-actions">
              <button
                disabled={!!busy}
                onClick={() =>
                  load(
                    `${import.meta.env.BASE_URL}demo-film.mp4`,
                    "暮色行旅 · 演示短片",
                  )
                }
              >
                试用演示短片 ↗
              </button>
              <button onClick={() => setRemote(!remote)}>视频链接</button>
            </div>
            {remote && (
              <form
                className="url-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  try {
                    const u = new URL(url);
                    if (!["https:", "http:"].includes(u.protocol))
                      throw new Error();
                    load(u.href, "远程影片");
                  } catch {
                    setError("请输入有效的 http(s) 视频直链。");
                  }
                }}
              >
                <label>
                  支持跨域的公开视频直链
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://…/movie.mp4"
                  />
                </label>
                <button disabled={!!busy}>读取</button>
                <small>不支持视频网站的播放页面。</small>
              </form>
            )}
            {source && (
              <div className="file-meta">
                <span>{timecode(meta.duration)}</span>
                <span>
                  {meta.width} × {meta.height}
                </span>
              </div>
            )}
            <fieldset disabled={!!busy}>
              <div className="step second">
                02 <span>编排画面</span>
              </div>
              <label>
                抽样帧数
                <select
                  value={count}
                  onChange={(e) => {
                    setCount(+e.target.value);
                  }}
                >
                  <option value={24}>24 帧 · 精简</option>
                  <option value={48}>48 帧 · 标准</option>
                  <option value={96}>96 帧 · 细节</option>
                </select>
              </label>
              <div className="time-fields">
                <label>
                  开始（秒）
                  <input
                    type="number"
                    min={0}
                    max={end}
                    step="0.001"
                    value={start}
                    disabled={!source || !!busy}
                    onChange={(e) => setStart(+e.target.value)}
                  />
                </label>
                <label>
                  结束（秒）
                  <input
                    type="number"
                    min={start}
                    max={meta.duration}
                    step="0.001"
                    value={end}
                    disabled={!source || !!busy}
                    onChange={(e) => setEnd(+e.target.value)}
                  />
                </label>
              </div>
              <label>
                联系表列数
                <div className="segments">
                  {[3, 4, 6].map((n) => (
                    <button
                      key={n}
                      className={columns === n ? "selected" : ""}
                      onClick={() => setColumns(n)}
                    >
                      {n} 列
                    </button>
                  ))}
                </div>
              </label>
              <p className="muted">
                等间隔抽样，保留画面比例。
                <br />
                每帧均可定位到影片中的原始时刻。
              </p>
            </fieldset>
            <button
              className="primary"
              disabled={!source || !!busy}
              onClick={generate}
            >
              {frames.length ? "重新生成" : "生成视觉地图"} <span>↗</span>
            </button>
            <p className="privacy">
              <span>●</span> 本地视频始终留在你的浏览器
            </p>
            <div className="aside-footer">
              每个故事，
              <br />
              都有自己的颜色。<span>LOOK CLOSER.</span>
            </div>
          </aside>
          <section className="stage">
            <div className="stage-toolbar">
              <div className="view-tabs">
                <button
                  className={mode === "sheet" ? "active" : ""}
                  onClick={() => setMode("sheet")}
                >
                  ▦ 联系表
                </button>
                <button
                  className={mode === "color" ? "active" : ""}
                  onClick={() => setMode("color")}
                >
                  ▥ 色彩长卷
                </button>
              </div>
              <button
                className="export"
                disabled={!frames.length || !!busy}
                onClick={save}
              >
                ↓ 导出海报
              </button>
            </div>
            {error && (
              <div className="error" role="alert">
                {error}
                <button aria-label="关闭提示" onClick={() => setError("")}>
                  ×
                </button>
              </div>
            )}
            {busy && (
              <div className="progress" role="status">
                <span>
                  {busy}
                  {busy === "正在逐帧读取" ? ` · ${progress}%` : ""}
                </span>
                {controller.current && (
                  <button onClick={() => controller.current?.abort()}>
                    取消
                  </button>
                )}
                <progress value={progress} max={100} />
              </div>
            )}
            {!source ? (
              <div className="empty">
                <div className="empty-top">
                  <span>STUDY Nº 001</span>
                  <span>LIGHT / COLOR / TIME</span>
                </div>
                <div className="film-art">
                  <div className="sun" />
                  <div className="hill back" />
                  <div className="hill front" />
                  <div className="film-caption">
                    INTO THE
                    <br />
                    <i>quiet.</i>
                  </div>
                  <span className="film-time">00:00:00</span>
                </div>
                <div className="palette">
                  {palettes.map((c) => (
                    <span key={c} style={{ background: c }} />
                  ))}
                </div>
                <div className="empty-note">
                  <h2>看见时间的形状</h2>
                  <p>
                    导入影片，生成专属于它的画面索引。
                    <br />
                    也可以先用演示短片，探索两种观看方式。
                  </p>
                </div>
                <div className="empty-bottom">
                  <span>01 / 导入</span>
                  <span>02 / 抽样</span>
                  <span>03 / 收藏</span>
                </div>
              </div>
            ) : (
              <>
                <div className="player-wrap">
                  <video
                    ref={video}
                    src={source}
                    controls
                    preload="metadata"
                    playsInline
                  />
                  <div className="player-caption">
                    <span>{name}</span>
                    <span>
                      {frames.length
                        ? `FRAME ${String(active + 1).padStart(2, "0")} / ${frames.length}`
                        : "READY TO EXPLORE"}
                    </span>
                  </div>
                </div>
                {!frames.length ? (
                  <div className="ready">
                    <span>影片已就绪</span>
                    <p>选择帧数和时间范围，点击「生成视觉地图」。</p>
                  </div>
                ) : (
                  <>
                    <div className="map-heading">
                      <div>
                        <span className="eyebrow">
                          {mode === "sheet" ? "CONTACT SHEET" : "COLOR SCRIPT"}
                        </span>
                        <h2>
                          {mode === "sheet" ? "故事的切片" : "时间的调色盘"}
                        </h2>
                      </div>
                      <label className="zoom">
                        缩放
                        <select
                          value={zoom}
                          onChange={(e) => setZoom(+e.target.value)}
                        >
                          <option value={1}>100%</option>
                          <option value={1.5}>150%</option>
                          <option value={2}>200%</option>
                        </select>
                      </label>
                    </div>
                    <div className="map-scroll">
                      <div style={{ width: `${zoom * 100}%` }}>
                        {mode === "sheet" ? (
                          <div
                            className="frame-grid"
                            style={{
                              gridTemplateColumns: `repeat(${columns},minmax(0,1fr))`,
                            }}
                          >
                            {frames.map((f, i) => (
                              <button
                                className={`frame ${active === i ? "current" : ""}`}
                                key={f.url}
                                onClick={() => seek(i)}
                                aria-label={`定位 ${timecode(f.time)}`}
                              >
                                <img
                                  src={f.url}
                                  alt={`影片 ${timecode(f.time)}`}
                                />
                                <span>
                                  <b>{String(i + 1).padStart(2, "0")}</b>
                                  {timecode(f.time)}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="color-map">
                            {frames.map((f, i) => (
                              <button
                                className={active === i ? "current" : ""}
                                key={f.url}
                                onClick={() => seek(i)}
                                style={{ background: f.color }}
                                aria-label={`定位色彩帧 ${timecode(f.time)}`}
                                title={timecode(f.time)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="timeline-labels">
                      <span>{timecode(frames[0].time)}</span>
                      <span>点击画面，回到那个瞬间</span>
                      <span>{timecode(frames[frames.length - 1].time)}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        </div>
        <footer>
          <span>ONE SECOND MOVIE — 影片视觉地图</span>
          <span>Made for the moments in between.</span>
        </footer>
      </main>
    </div>
  );
}
