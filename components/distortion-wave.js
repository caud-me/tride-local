/* tunable wave variables (adjust or keyframe any value below) */
const WAVE_DURATION = 2300;
const WAVE_ORIGIN_X = 0.5;
const WAVE_ORIGIN_Y = 0.04;
const WAVE_FOLLOW_CURSOR = false;
let lastCursorPos = null;

if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
    document.addEventListener("pointerdown", function (evt) {
        lastCursorPos = { clientX: evt.clientX, clientY: evt.clientY };
    }, true);
    document.addEventListener("mousemove", function (evt) {
        lastCursorPos = { clientX: evt.clientX, clientY: evt.clientY };
    }, true);
}
// <patch-1>
const WAVE_AIRDROP_EXPERIMENTAL = true;
const WAVE_AIRDROP_BEZIER_X1 = 0.76;
const WAVE_AIRDROP_BEZIER_Y1 = 0.0;
const WAVE_AIRDROP_BEZIER_X2 = 0.14;
const WAVE_AIRDROP_BEZIER_Y2 = 1.0;
const WAVE_AIRDROP_PULL_SCALE = 0.018;
const WAVE_AIRDROP_BLOOM_SCALE = 0.022;
const WAVE_BEZIER_X1 = 0.5;
const WAVE_BEZIER_Y1 = 0.0;
const WAVE_BEZIER_X2 = 0.0;
const WAVE_BEZIER_Y2 = 1.0;
// </patch-1>
const WAVE_AMPLITUDE = 0.16;
const WAVE_RIPPLE_FREQ = 14.0;
const WAVE_RIPPLE_MIX = 0.35;
const WAVE_ABERRATION = 0.042;
const WAVE_RIM_WIDTH = 0.14;
const WAVE_BLUR_AMOUNT = 0.016;
const WAVE_GLOW_INTENSITY = 0.72;
const WAVE_GLOW_SPREAD = 2.4;
const WAVE_CORE_SPARK = 0.45;
// <patch-1>
const WAVE_MESH_SHARPNESS = 3.2;
const WAVE_MESH_FLOW = 2.2;
// <patch-1>
// <patch-1>
const WAVE_EDGE_LIGHT_INTENSITY = 0.85;
const WAVE_EDGE_LIGHT_WIDTH = 0.055;
// <patch-2>
const WAVE_EDGE_CREST_BOOST = 1.85;
const WAVE_EDGE_HALO_POWER = 1.4;
// </patch-2>
const WAVE_PARTICLE_COUNT = 160;
const WAVE_PARTICLE_SIZE = 0.0018;
const WAVE_PARTICLE_HALO = 1.35;
const WAVE_PARTICLE_GLOW = 1.85;
const WAVE_PARTICLE_DRIFT = 0.24;
const WAVE_PARTICLE_EASE = 2.4;
const WAVE_PARTICLE_TAIL_MS = 1000;
const WAVE_MAX_DPR = 2;
const WAVE_MAX_TEXTURE_DIM = 4096;
// </patch-1>
// </patch-1>
let cachedRuleGroups = null;
let cachedCssPromise = null;

function trArrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i += 1) {
        binary = binary + String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function trInlineFontUrls(cssText, baseHref) {
    const matches = cssText.match(/url\(([^)]+\.(?:ttf|woff2?|otf)[^)]*)\)/gi);
    if (!matches || matches.length === 0) {
        return cssText;
    }

    let result = cssText;
    const seen = {};
    const count = matches.length;
    for (let i = 0; i < count; i += 1) {
        const rawMatch = matches[i];
        const inner = rawMatch.slice(4, -1).trim().replace(/^["']|["']$/g, "");
        if (!inner || inner.indexOf("data:") === 0 || seen[inner]) {
            continue;
        }
        seen[inner] = true;
        try {
            const fetchUrl = baseHref ? new URL(inner, baseHref).href : inner;
            const res = await fetch(fetchUrl);
            if (!res.ok) {
                continue;
            }
            const buf = await res.arrayBuffer();
            const b64 = trArrayBufferToBase64(buf);
            const mime = inner.indexOf(".woff2") !== -1 ? "font/woff2" : "font/ttf";
            const dataUri = "url(\"data:" + mime + ";base64," + b64 + "\")";
            result = result.split(rawMatch).join(dataUri);
        } catch (err) {
            /* keep original url if font fetch fail */
        }
    }
    return result;
}

function trResolveActiveCss(entries) {
    let out = "";
    const count = entries.length;
    for (let i = 0; i < count; i += 1) {
        const entry = entries[i];
        if (!entry.media) {
            out = out + entry.css;
        } else if (typeof window.matchMedia === "function" && window.matchMedia(entry.media).matches) {
            out = out + entry.css;
        }
    }
    return out;
}

// ive looked up on the internet on this one, gather page css text once and filter active media rule for crisp exact snapshot
function trCollectDocumentCss() {
    if (cachedRuleGroups !== null) {
        return Promise.resolve(trResolveActiveCss(cachedRuleGroups));
    }
    if (cachedCssPromise !== null) {
        return cachedCssPromise;
    }
    const jobs = [];
    const sheets = document.styleSheets;
    const sheetCount = sheets.length;
    for (let i = 0; i < sheetCount; i += 1) {
        const sheet = sheets[i];
        const baseHref = sheet.href || window.location.href;
        try {
            const rules = sheet.cssRules;
            const ruleCount = rules.length;
            let plainCss = "";
            for (let j = 0; j < ruleCount; j += 1) {
                const rule = rules[j];
                const isMedia = typeof CSSMediaRule !== "undefined" && rule instanceof CSSMediaRule;
                if (isMedia) {
                    if (plainCss) {
                        jobs.push(trInlineFontUrls(plainCss, baseHref).then(function (resolved) {
                            return { media: null, css: resolved };
                        }));
                        plainCss = "";
                    }
                    let innerCss = "";
                    const subRules = rule.cssRules;
                    const subCount = subRules.length;
                    for (let k = 0; k < subCount; k += 1) {
                        innerCss = innerCss + subRules[k].cssText + "\n";
                    }
                    const mediaExpr = rule.conditionText || rule.media.mediaText;
                    jobs.push(trInlineFontUrls(innerCss, baseHref).then(function (resolved) {
                        return { media: mediaExpr, css: resolved };
                    }));
                } else {
                    plainCss = plainCss + rule.cssText + "\n";
                }
            }
            if (plainCss) {
                jobs.push(trInlineFontUrls(plainCss, baseHref).then(function (resolved) {
                    return { media: null, css: resolved };
                }));
            }
        } catch (err) {
            /* skip external sheet that block script read */
        }
    }
    cachedCssPromise = Promise.all(jobs).then(function (entries) {
        cachedRuleGroups = entries;
        return trResolveActiveCss(cachedRuleGroups);
    });
    return cachedCssPromise;
}

function copyComputedStyles(sourceEl, targetEl) {
    const computed = window.getComputedStyle(sourceEl);
    let cssText = "";
    const total = computed.length;
    for (let i = 0; i < total; i += 1) {
        const propName = computed[i];
        const propValue = computed.getPropertyValue(propName);
        cssText = cssText + propName + ":" + propValue + ";";
    }
    targetEl.style.cssText = cssText;
}

function syncTreeStyles(sourceRoot, cloneRoot) {
    copyComputedStyles(sourceRoot, cloneRoot);
    cloneRoot.style.visibility = "visible";
    cloneRoot.style.margin = "0";
    const sourceList = sourceRoot.querySelectorAll("*");
    const cloneList = cloneRoot.querySelectorAll("*");
    const count = sourceList.length;
    for (let i = 0; i < count; i += 1) {
        const origNode = sourceList[i];
        const cloneNode = cloneList[i];
        if (cloneNode) {
            copyComputedStyles(origNode, cloneNode);
            const hasHiddenClass = origNode.classList.contains("hidden");
            if (!hasHiddenClass) {
                cloneNode.style.visibility = "visible";
            }
        }
    }
}

// ive looked up on the internet on this one, wrap cloned html and body style inside high-dpi svg foreignobject for sharp 1-to-1 picture load
function trCaptureNodeToImage(sourceNode, width, height, pixelWidth, pixelHeight) {
    const clone = sourceNode.cloneNode(true);
    clone.style.visibility = "visible";
    clone.style.margin = "0";
    clone.style.width = String(width) + "px";
    clone.style.height = String(height) + "px";

    return trCollectDocumentCss().then(function (docCss) {
        const htmlWrap = document.createElement("html");
        htmlWrap.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        const docAttrs = document.documentElement.attributes;
        for (let a = 0; a < docAttrs.length; a += 1) {
            const attr = docAttrs[a];
            if (attr && attr.name !== "xmlns") {
                htmlWrap.setAttribute(attr.name, attr.value);
            }
        }
        htmlWrap.style.width = String(width) + "px";
        htmlWrap.style.height = String(height) + "px";
        htmlWrap.style.margin = "0";
        htmlWrap.style.overflow = "hidden";

        const wrapper = document.createElement("body");
        wrapper.style.position = "relative";
        wrapper.style.width = String(width) + "px";
        wrapper.style.height = String(height) + "px";
        wrapper.style.margin = "0";
        wrapper.style.overflow = "hidden";

        const bodyStyle = window.getComputedStyle(document.body);
        wrapper.style.fontFamily = bodyStyle.fontFamily;
        wrapper.style.fontSize = bodyStyle.fontSize;
        wrapper.style.lineHeight = bodyStyle.lineHeight;
        wrapper.style.color = bodyStyle.color;
        wrapper.style.backgroundColor = bodyStyle.backgroundColor;

        if (docCss) {
            const styleEl = document.createElement("style");
            styleEl.textContent = docCss;
            wrapper.appendChild(styleEl);
        } else {
            syncTreeStyles(sourceNode, clone);
        }
        wrapper.appendChild(clone);
        htmlWrap.appendChild(wrapper);

        const serializer = new XMLSerializer();
        const xhtml = serializer.serializeToString(htmlWrap);
        const wStr = String(width);
        const hStr = String(height);
        const pxWStr = String(pixelWidth || width);
        const pxHStr = String(pixelHeight || height);
        let svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + pxWStr + "\" height=\"" + pxHStr + "\" viewBox=\"0 0 " + wStr + " " + hStr + "\">";
        svg = svg + "<foreignObject width=\"" + wStr + "\" height=\"" + hStr + "\">";
        svg = svg + xhtml;
        svg = svg + "</foreignObject></svg>";
        const encoded = encodeURIComponent(svg);
        const dataUrl = "data:image/svg+xml;charset=utf-8," + encoded;

        return new Promise(function (resolve, reject) {
            const img = new Image();
            img.onload = function () {
                resolve(img);
            };
            img.onerror = function (err) {
                reject(err);
            };
            img.src = dataUrl;
        });
    });
}

function trBuildVertexSource() {
    let src = "#version 300 es\n";
    src = src + "in vec2 a_pos;\n";
    src = src + "out vec2 v_uv;\n";
    src = src + "void main() {\n";
    src = src + "  v_uv = vec2((a_pos.x + 1.0) * 0.5, 1.0 - (a_pos.y + 1.0) * 0.5);\n";
    src = src + "  gl_Position = vec4(a_pos, 0.0, 1.0);\n";
    src = src + "}\n";
    return src;
}

function trBuildFragmentSource() {
    let src = "#version 300 es\n";
    src = src + "precision highp float;\n";
    src = src + "in vec2 v_uv;\n";
    src = src + "uniform sampler2D u_texFrom;\n";
    src = src + "uniform sampler2D u_texTo;\n";
    src = src + "uniform float u_progress;\n";
    src = src + "uniform vec2 u_origin;\n";
    src = src + "uniform float u_aspect;\n";
    src = src + "uniform int u_mode;\n";
    src = src + "uniform vec3 u_tint;\n";
    src = src + "uniform int u_colorMode;\n";
    src = src + "uniform float u_amplitude;\n";
    src = src + "uniform float u_rippleFreq;\n";
    src = src + "uniform float u_rippleMix;\n";
    src = src + "uniform float u_aberration;\n";
    src = src + "uniform float u_rimWidth;\n";
    src = src + "uniform float u_blurAmount;\n";

    src = src + "uniform float u_glowIntensity;\n";
    src = src + "uniform float u_glowSpread;\n";
    src = src + "uniform float u_coreSpark;\n";
    // <patch-1>
    src = src + "uniform float u_meshSharpness;\n";
    src = src + "uniform float u_meshFlow;\n";
    // <patch-1>
    // <patch-1>
    src = src + "uniform float u_edgeLightIntensity;\n";
    src = src + "uniform float u_edgeLightWidth;\n";
    src = src + "uniform float u_edgeCrestBoost;\n";
    // <patch-2>
    src = src + "uniform float u_edgeHaloPower;\n";
    // </patch-2>
    // </patch-1>
    // </patch-1>
    src = src + "uniform int u_particleCount;\n";
    src = src + "uniform float u_particleSize;\n";
    // <patch-1>
    src = src + "uniform float u_particleHalo;\n";
    // </patch-1>
    src = src + "uniform float u_particleGlow;\n";
    src = src + "uniform float u_particleDrift;\n";
    src = src + "uniform float u_particleEase;\n";
    src = src + "uniform float u_particleTail;\n";
    src = src + "uniform float u_particleTime;\n";
    src = src + "out vec4 outColor;\n";

    src = src + "float hash11(float p) {\n";
    src = src + "  vec3 p3 = fract(vec3(p) * 0.1031);\n";
    src = src + "  p3 += dot(p3, p3.yzx + 33.33);\n";
    src = src + "  return fract((p3.x + p3.y) * p3.z);\n";
    src = src + "}\n";
    src = src + "vec3 sampleGlass(sampler2D tex, vec2 uv, vec2 split, float blurSize) {\n";
    src = src + "  vec2 uvR = clamp(uv + split, 0.001, 0.999);\n";
    src = src + "  vec2 uvG = clamp(uv, 0.001, 0.999);\n";
    src = src + "  vec2 uvB = clamp(uv - split, 0.001, 0.999);\n";
    src = src + "  if (blurSize < 0.0008) {\n";
    src = src + "    return vec3(texture(tex, uvR).r, texture(tex, uvG).g, texture(tex, uvB).b);\n";
    src = src + "  }\n";
    src = src + "  vec2 bX = vec2(blurSize, 0.0);\n";
    src = src + "  vec2 bY = vec2(0.0, blurSize);\n";
    src = src + "  float r = texture(tex, uvR).r + texture(tex, clamp(uvR + bX, 0.001, 0.999)).r + texture(tex, clamp(uvR - bX, 0.001, 0.999)).r + texture(tex, clamp(uvR + bY, 0.001, 0.999)).r + texture(tex, clamp(uvR - bY, 0.001, 0.999)).r;\n";
    src = src + "  float g = texture(tex, uvG).g + texture(tex, clamp(uvG + bX, 0.001, 0.999)).g + texture(tex, clamp(uvG - bX, 0.001, 0.999)).g + texture(tex, clamp(uvG + bY, 0.001, 0.999)).g + texture(tex, clamp(uvG - bY, 0.001, 0.999)).g;\n";
    src = src + "  float b = texture(tex, uvB).b + texture(tex, clamp(uvB + bX, 0.001, 0.999)).b + texture(tex, clamp(uvB - bX, 0.001, 0.999)).b + texture(tex, clamp(uvB + bY, 0.001, 0.999)).b + texture(tex, clamp(uvB - bY, 0.001, 0.999)).b;\n";
    src = src + "  return vec3(r, g, b) * 0.2;\n";
    src = src + "}\n";
    src = src + "void main() {\n";
    src = src + "  vec2 aspectScale = vec2(u_aspect, 1.0);\n";
    src = src + "  float d = 0.0;\n";
    src = src + "  vec2 dir = vec2(0.0, -1.0);\n";
    src = src + "  if (u_mode == 0) {\n";
    src = src + "    vec2 diff = (v_uv - u_origin) * aspectScale;\n";
    src = src + "    float c0 = length((vec2(0.0, 0.0) - u_origin) * aspectScale);\n";
    src = src + "    float c1 = length((vec2(1.0, 0.0) - u_origin) * aspectScale);\n";
    src = src + "    float c2 = length((vec2(0.0, 1.0) - u_origin) * aspectScale);\n";
    src = src + "    float c3 = length((vec2(1.0, 1.0) - u_origin) * aspectScale);\n";
    src = src + "    float maxDist = max(max(c0, c1), max(c2, c3));\n";
    src = src + "    d = length(diff) / max(maxDist, 0.0001);\n";
    src = src + "    vec2 rawDir = v_uv - u_origin;\n";
    src = src + "    float dirLen = length(rawDir);\n";
    src = src + "    if (dirLen > 0.0001) { dir = rawDir / dirLen; }\n";
    src = src + "  } else if (u_mode == 1) {\n";
    src = src + "    float maxY = max(u_origin.y, 1.0 - u_origin.y);\n";
    src = src + "    d = abs(v_uv.y - u_origin.y) / max(maxY, 0.0001);\n";
    src = src + "    dir = vec2(0.0, v_uv.y >= u_origin.y ? 1.0 : -1.0);\n";
    src = src + "  } else {\n";
    src = src + "    float maxX = max(u_origin.x, 1.0 - u_origin.x);\n";
    src = src + "    d = abs(v_uv.x - u_origin.x) / max(maxX, 0.0001);\n";
    src = src + "    dir = vec2(v_uv.x >= u_origin.x ? 1.0 : -1.0, 0.0);\n";
    src = src + "  }\n";
    src = src + "  float w = max(u_rimWidth, 0.02);\n";
    src = src + "  float front = u_progress * (1.0 + w * 2.2) - w * 1.1;\n";
    src = src + "  float delta = d - front;\n";
    src = src + "  float crest = exp(-(delta * delta) / (w * w));\n";
    src = src + "  float baseEnv = sin(clamp(u_progress, 0.0, 1.0) * 3.14159265);\n";
    src = src + "  float bounceEnv = abs(u_progress - clamp(u_progress, 0.0, 1.0)) * 3.2;\n";
    src = src + "  float envelope = clamp(baseEnv + bounceEnv, 0.0, 1.35);\n";
    src = src + "  float power = crest * envelope;\n";
    src = src + "  float reveal = 1.0 - smoothstep(-w * 0.5, w * 0.5, delta);\n";
    src = src + "  vec3 color = vec3(0.0);\n";
    src = src + "  if (power < 0.002 && reveal >= 0.998) {\n";
    src = src + "    color = texture(u_texTo, v_uv).rgb;\n";
    src = src + "  } else if (power < 0.002 && reveal <= 0.002) {\n";
    src = src + "    color = texture(u_texFrom, v_uv).rgb;\n";
    src = src + "  } else {\n";
    src = src + "    float normDelta = delta / w;\n";
    src = src + "    float ripple = sin(normDelta * u_rippleFreq) * u_rippleMix;\n";
    src = src + "    float lensBend = (normDelta + ripple) * u_amplitude * power;\n";
    src = src + "    vec2 warpedUv = clamp(v_uv - dir * lensBend, 0.001, 0.999);\n";
    src = src + "    vec2 split = dir * (u_aberration * power * (1.0 + abs(ripple)));\n";
    src = src + "    float blurSize = power * u_blurAmount;\n";
    src = src + "    if (reveal >= 0.998) {\n";
    src = src + "      color = sampleGlass(u_texTo, warpedUv, split, blurSize);\n";
    src = src + "    } else if (reveal <= 0.002) {\n";
    src = src + "      color = sampleGlass(u_texFrom, warpedUv, split, blurSize);\n";
    src = src + "    } else {\n";
    src = src + "      vec3 fromCol = sampleGlass(u_texFrom, warpedUv, split, blurSize);\n";
    src = src + "      vec3 toCol = sampleGlass(u_texTo, warpedUv, split, blurSize);\n";
    src = src + "      color = mix(fromCol, toCol, reveal);\n";
    src = src + "    }\n";
    src = src + "  }\n";
    src = src + "  float haloW = w * max(u_glowSpread, 0.5);\n";
    src = src + "  float halo = exp(-(delta * delta) / (haloW * haloW)) * envelope;\n";
    src = src + "  float coreW = w * 0.34;\n";
    src = src + "  float core = exp(-(delta * delta) / (coreW * coreW)) * envelope;\n";

    src = src + "  vec3 waveColor = u_tint;\n";
    src = src + "  vec3 sparkColor = mix(waveColor, vec3(1.0), 0.65);\n";
    src = src + "  vec3 pTint = mix(waveColor * 1.3, vec3(1.0), 0.72);\n";
    src = src + "  if (u_colorMode == 1) {\n";
    src = src + "    float phase = u_progress * u_meshFlow;\n";
    src = src + "    float ang = atan(v_uv.y - u_origin.y, (v_uv.x - u_origin.x) * u_aspect);\n";
    src = src + "    float band = ang * 0.31831 + phase * 0.35 + d * 0.65;\n";
    src = src + "    vec3 rainbow = 0.5 + 0.5 * cos(6.28318 * (band + vec3(0.0, 0.33, 0.67)));\n";
    src = src + "    vec2 warp = vec2(sin(v_uv.y * 5.0 + phase), cos(v_uv.x * 5.0 - phase)) * 0.11;\n";
    src = src + "    vec2 mUv = v_uv + warp;\n";
    src = src + "    vec2 m0 = vec2(0.22 + 0.2 * sin(phase), 0.25 + 0.18 * cos(phase * 0.8));\n";
    src = src + "    vec2 m1 = vec2(0.78 + 0.18 * cos(phase * 0.9), 0.28 + 0.2 * sin(phase * 1.1));\n";
    src = src + "    vec2 m2 = vec2(0.26 + 0.19 * cos(phase * 1.2), 0.76 + 0.17 * sin(phase * 0.7));\n";
    src = src + "    vec2 m3 = vec2(0.76 + 0.17 * sin(phase * 0.85), 0.74 + 0.19 * cos(phase * 1.15));\n";
    src = src + "    float sharp = max(u_meshSharpness, 0.5) * 1.8;\n";
    src = src + "    vec2 d0 = (mUv - m0) * aspectScale;\n";
    src = src + "    vec2 d1 = (mUv - m1) * aspectScale;\n";
    src = src + "    vec2 d2 = (mUv - m2) * aspectScale;\n";
    src = src + "    vec2 d3 = (mUv - m3) * aspectScale;\n";
    src = src + "    float w0 = exp(-dot(d0, d0) * sharp) + 0.001;\n";
    src = src + "    float w1 = exp(-dot(d1, d1) * sharp) + 0.001;\n";
    src = src + "    float w2 = exp(-dot(d2, d2) * sharp) + 0.001;\n";
    src = src + "    float w3 = exp(-dot(d3, d3) * sharp) + 0.001;\n";
    src = src + "    vec3 c0 = vec3(0.04, 0.88, 1.0);\n";
    src = src + "    vec3 c1 = vec3(1.0, 0.12, 0.62);\n";
    src = src + "    vec3 c2 = vec3(1.0, 0.56, 0.06);\n";
    src = src + "    vec3 c3 = vec3(0.14, 0.96, 0.48);\n";
    src = src + "    vec3 meshCol = (c0 * w0 + c1 * w1 + c2 * w2 + c3 * w3) / (w0 + w1 + w2 + w3);\n";
    src = src + "    waveColor = pow(mix(meshCol, rainbow, 0.52), vec3(1.35)) * 1.18;\n";
    src = src + "    sparkColor = mix(waveColor, vec3(1.0), 0.22);\n";
    src = src + "    pTint = mix(waveColor * 1.15, vec3(1.0), 0.25);\n";
    src = src + "  } else if (u_colorMode == 2) {\n";
    src = src + "    float phase = u_progress * u_meshFlow;\n";
    src = src + "    vec2 warp = vec2(sin(v_uv.y * 4.2 + phase), cos(v_uv.x * 4.2 - phase)) * 0.09;\n";
    src = src + "    vec2 mUv = v_uv + warp;\n";
    src = src + "    vec2 m0 = vec2(0.22 + 0.18 * sin(phase), 0.25 + 0.16 * cos(phase * 0.8));\n";
    src = src + "    vec2 m1 = vec2(0.78 + 0.16 * cos(phase * 0.9), 0.28 + 0.18 * sin(phase * 1.1));\n";
    src = src + "    vec2 m2 = vec2(0.26 + 0.17 * cos(phase * 1.2), 0.76 + 0.15 * sin(phase * 0.7));\n";
    src = src + "    vec2 m3 = vec2(0.76 + 0.15 * sin(phase * 0.85), 0.74 + 0.17 * cos(phase * 1.15));\n";
    src = src + "    vec2 d0 = (mUv - m0) * aspectScale;\n";
    src = src + "    vec2 d1 = (mUv - m1) * aspectScale;\n";
    src = src + "    vec2 d2 = (mUv - m2) * aspectScale;\n";
    src = src + "    vec2 d3 = (mUv - m3) * aspectScale;\n";
    src = src + "    float sharp = max(u_meshSharpness, 0.5);\n";
    src = src + "    float w0 = exp(-dot(d0, d0) * sharp) + 0.001;\n";
    src = src + "    float w1 = exp(-dot(d1, d1) * sharp) + 0.001;\n";
    src = src + "    float w2 = exp(-dot(d2, d2) * sharp) + 0.001;\n";
    src = src + "    float w3 = exp(-dot(d3, d3) * sharp) + 0.001;\n";
    src = src + "    vec3 c0 = vec3(0.12, 0.88, 0.96);\n";
    src = src + "    vec3 c1 = vec3(0.86, 0.28, 0.95);\n";
    src = src + "    vec3 c2 = vec3(0.99, 0.52, 0.28);\n";
    src = src + "    vec3 c3 = vec3(0.22, 0.95, 0.62);\n";
    src = src + "    waveColor = (c0 * w0 + c1 * w1 + c2 * w2 + c3 * w3) / (w0 + w1 + w2 + w3);\n";
    src = src + "    sparkColor = mix(waveColor, vec3(1.0), 0.65);\n";
    src = src + "    pTint = mix(waveColor * 1.3, vec3(1.0), 0.72);\n";
    src = src + "  }\n";
    src = src + "  color += waveColor * (halo * u_glowIntensity);\n";
    src = src + "  color += sparkColor * (core * u_coreSpark);\n";
    src = src + "  if (u_edgeLightIntensity > 0.001 && halo > 0.002) {\n";
    src = src + "    vec2 edgeVec = min(v_uv, 1.0 - v_uv);\n";
    src = src + "    float edgeDist = min(edgeVec.x * u_aspect, edgeVec.y);\n";
    src = src + "    float edgeW = max(u_edgeLightWidth, 0.005);\n";
    src = src + "    float edgeFalloff = exp(-(edgeDist * edgeDist) / (edgeW * edgeW));\n";
    src = src + "    float edgeRim = exp(-edgeDist / (edgeW * 0.28));\n";
    src = src + "    float safeHalo = max(halo, 0.0001);\n";
    src = src + "    float edgeHalo = max(pow(safeHalo, max(u_edgeHaloPower, 0.2)) - 0.0001, 0.0) * u_edgeCrestBoost;\n";
    src = src + "    color += waveColor * (edgeFalloff * edgeHalo * u_edgeLightIntensity);\n";
    src = src + "    color += sparkColor * (edgeRim * edgeHalo * (u_edgeLightIntensity * 0.65));\n";
    src = src + "  }\n";
    src = src + "  vec3 particleLight = vec3(0.0);\n";
    // ive looked up on the internet on this one, trail bright sparkle dot behind wave crest so tiny speck stand out
    src = src + "  float pClamped = clamp(u_progress, 0.0, 1.0);\n";
    src = src + "  float swept = 1.0 - smoothstep(-w * 0.1, w * 0.9, delta);\n";
    src = src + "  float tailFade = 1.0 - smoothstep(0.0, 1.0, clamp(u_particleTail, 0.0, 1.0));\n";
    src = src + "  float pFade = smoothstep(0.0, 0.08, pClamped) * tailFade;\n";
    src = src + "  float pZone = clamp(halo * 1.35 + swept, 0.0, 1.0) * pFade;\n";
    src = src + "  if (pZone > 0.02 && u_particleCount > 0) {\n";
    src = src + "    float pTotal = clamp(u_particleTime, 0.0, 1.0);\n";
    src = src + "    float pExp = max(u_particleEase, 1.0);\n";
    src = src + "    float pEase = 1.0 - pow(1.0 - pTotal, pExp);\n";
    src = src + "    float maxBaseRad = max(u_particleSize, 0.001) * 1.1 * max(u_particleHalo, 1.0) * 2.2;\n";
    src = src + "    float maxBaseRadSq = maxBaseRad * maxBaseRad;\n";
    src = src + "    for (int i = 0; i < 180; i++) {\n";
    src = src + "      if (i >= u_particleCount) { break; }\n";
    src = src + "      float fi = float(i) + 1.0;\n";
    src = src + "      vec2 seed = vec2(hash11(fi * 13.17), hash11(fi * 29.53));\n";
    src = src + "      vec2 outDir = normalize(seed - u_origin + vec2(0.0001));\n";
    src = src + "      vec2 swirl = vec2(hash11(fi * 47.11) - 0.5, hash11(fi * 71.89) - 0.5) * 0.6;\n";
    src = src + "      vec2 driftDir = outDir + swirl;\n";
    src = src + "      vec2 pPos = seed + driftDir * (pEase * u_particleDrift);\n";
    src = src + "      vec2 pDiff = (v_uv - pPos) * aspectScale;\n";
    src = src + "      float distSq = dot(pDiff, pDiff);\n";
    src = src + "      if (distSq > maxBaseRadSq) { continue; }\n";
    src = src + "      float pDist = sqrt(distSq);\n";
    src = src + "      float pRadius = max(u_particleSize, 0.001) * (0.45 + 0.65 * hash11(fi * 91.3));\n";
    src = src + "      float coreSpeck = smoothstep(pRadius, 0.0, pDist);\n";
    src = src + "      coreSpeck = coreSpeck * coreSpeck;\n";
    src = src + "      float haloRadius = pRadius * max(u_particleHalo, 1.0);\n";
    src = src + "      float glowSpeck = exp(-distSq / (haloRadius * haloRadius * 0.35)) * 0.55;\n";
    src = src + "      float twinkle = 0.55 + 0.45 * sin(pEase * 16.0 + fi * 2.7);\n";
    src = src + "      particleLight += pTint * ((coreSpeck + glowSpeck) * twinkle * pZone * u_particleGlow);\n";
    src = src + "    }\n";
    src = src + "  }\n";
    // </patch-1>

    src = src + "  color += particleLight;\n";
    src = src + "  outColor = vec4(color, 1.0);\n";
    src = src + "}\n";
    return src;
}

// ive looked up on the internet on this one, compile vertex or fragment gpu code and check for build error
function trCompileShader(gl, shaderType, sourceCode) {
    const shader = gl.createShader(shaderType);
    if (!shader) {
        return null;
    }
    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);
    const isOk = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!isOk) {
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// ive looked up on the internet on this one, join vertex and fragment gpu shader into one active program
function trBuildWaveProgram(gl) {
    const vertSrc = trBuildVertexSource();
    const fragSrc = trBuildFragmentSource();
    const vertShader = trCompileShader(gl, gl.VERTEX_SHADER, vertSrc);
    if (!vertShader) {
        return null;
    }
    const fragShader = trCompileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    if (!fragShader) {
        gl.deleteShader(vertShader);
        return null;
    }
    const program = gl.createProgram();
    if (!program) {
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
        return null;
    }
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
    const isLinked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!isLinked) {
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

// ive looked up on the internet on this one, load dom snapshot picture into gpu memory for fast pixel sampling
function trUploadWaveTexture(gl, imageEl) {
    const tex = gl.createTexture();
    if (!tex) {
        return null;
    }
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageEl);
    return tex;
}

// ive looked up on the internet on this one, set up webgl2 drawing surface and cache shader input location
function trCreateWaveRenderer(canvas) {
    const glOpts = {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false
    };
    const gl = canvas.getContext("webgl2", glOpts);
    if (!gl) {
        return null;
    }
    const program = trBuildWaveProgram(gl);
    if (!program) {
        return null;
    }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const quadCorners = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
    const quadData = new Float32Array(quadCorners);
    gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
        texFrom: gl.getUniformLocation(program, "u_texFrom"),
        texTo: gl.getUniformLocation(program, "u_texTo"),
        progress: gl.getUniformLocation(program, "u_progress"),
        origin: gl.getUniformLocation(program, "u_origin"),
        aspect: gl.getUniformLocation(program, "u_aspect"),
        mode: gl.getUniformLocation(program, "u_mode"),
        tint: gl.getUniformLocation(program, "u_tint"),
        colorMode: gl.getUniformLocation(program, "u_colorMode"),
        amplitude: gl.getUniformLocation(program, "u_amplitude"),
        rippleFreq: gl.getUniformLocation(program, "u_rippleFreq"),
        rippleMix: gl.getUniformLocation(program, "u_rippleMix"),
        aberration: gl.getUniformLocation(program, "u_aberration"),
        rimWidth: gl.getUniformLocation(program, "u_rimWidth"),
        blurAmount: gl.getUniformLocation(program, "u_blurAmount"),

        glowIntensity: gl.getUniformLocation(program, "u_glowIntensity"),
        glowSpread: gl.getUniformLocation(program, "u_glowSpread"),
        coreSpark: gl.getUniformLocation(program, "u_coreSpark"),
        // <patch-1>
        meshSharpness: gl.getUniformLocation(program, "u_meshSharpness"),
        meshFlow: gl.getUniformLocation(program, "u_meshFlow"),
        // <patch-1>
        // <patch-1>
        edgeLightIntensity: gl.getUniformLocation(program, "u_edgeLightIntensity"),
        edgeLightWidth: gl.getUniformLocation(program, "u_edgeLightWidth"),
        edgeCrestBoost: gl.getUniformLocation(program, "u_edgeCrestBoost"),
        // <patch-2>
        edgeHaloPower: gl.getUniformLocation(program, "u_edgeHaloPower"),
        // </patch-2>
        // </patch-1>
        // </patch-1>
        particleCount: gl.getUniformLocation(program, "u_particleCount"),
        particleSize: gl.getUniformLocation(program, "u_particleSize"),
        // <patch-1>
        particleHalo: gl.getUniformLocation(program, "u_particleHalo"),
        // </patch-1>
        particleGlow: gl.getUniformLocation(program, "u_particleGlow"),
        particleDrift: gl.getUniformLocation(program, "u_particleDrift"),
        particleEase: gl.getUniformLocation(program, "u_particleEase"),
        particleTail: gl.getUniformLocation(program, "u_particleTail"),
        particleTime: gl.getUniformLocation(program, "u_particleTime")
    };

    // ive looked up on the internet on this one, draw one warped wave frame between old and new view texture
    function drawFrame(state) {
        const w = canvas.width;
        const h = canvas.height;
        const safeH = Math.max(h, 1);
        const aspect = w / safeH;

        gl.viewport(0, 0, w, h);
        gl.useProgram(program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, state.texFrom);
        gl.uniform1i(uniforms.texFrom, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, state.texTo);
        gl.uniform1i(uniforms.texTo, 1);

        gl.uniform1f(uniforms.progress, state.progress);
        gl.uniform2f(uniforms.origin, state.originX, state.originY);
        gl.uniform1f(uniforms.aspect, aspect);
        gl.uniform1i(uniforms.mode, state.mode);
        gl.uniform3f(uniforms.tint, state.tintR, state.tintG, state.tintB);
        gl.uniform1i(uniforms.colorMode, state.colorMode);
        gl.uniform1f(uniforms.amplitude, state.amplitude);
        gl.uniform1f(uniforms.rippleFreq, state.rippleFreq);
        gl.uniform1f(uniforms.rippleMix, state.rippleMix);
        gl.uniform1f(uniforms.aberration, state.aberration);
        gl.uniform1f(uniforms.rimWidth, state.rimWidth);
        gl.uniform1f(uniforms.blurAmount, state.blurAmount);

        gl.uniform1f(uniforms.glowIntensity, state.glowIntensity);
        gl.uniform1f(uniforms.glowSpread, state.glowSpread);
        gl.uniform1f(uniforms.coreSpark, state.coreSpark);
        // <patch-1>
        gl.uniform1f(uniforms.meshSharpness, state.meshSharpness);
        gl.uniform1f(uniforms.meshFlow, state.meshFlow);
        // <patch-1>
        // <patch-1>
        gl.uniform1f(uniforms.edgeLightIntensity, state.edgeLightIntensity);
        gl.uniform1f(uniforms.edgeLightWidth, state.edgeLightWidth);
        gl.uniform1f(uniforms.edgeCrestBoost, state.edgeCrestBoost);
        // <patch-2>
        gl.uniform1f(uniforms.edgeHaloPower, state.edgeHaloPower);
        // </patch-2>
        // </patch-1>
        // </patch-1>
        gl.uniform1i(uniforms.particleCount, state.particleCount);
        gl.uniform1f(uniforms.particleSize, state.particleSize);
        // <patch-1>
        gl.uniform1f(uniforms.particleHalo, state.particleHalo);
        // </patch-1>
        gl.uniform1f(uniforms.particleGlow, state.particleGlow);
        gl.uniform1f(uniforms.particleDrift, state.particleDrift);
        gl.uniform1f(uniforms.particleEase, state.particleEase);
        gl.uniform1f(uniforms.particleTail, state.particleTail || 0);
        gl.uniform1f(uniforms.particleTime, state.particleTime || 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function destroy() {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
    }

    return {
        gl: gl,
        drawFrame: drawFrame,
        destroy: destroy
    };
}

// ive looked up on the internet on this one, turn six digit hex color text into three decimal rgb number
function trParseHexRgb(hexText) {
    const rawText = hexText || "";
    let clean = String(rawText);
    clean = clean.trim();
    const hasHash = clean.startsWith("#");
    if (hasHash) {
        clean = clean.slice(1);
    }
    if (clean.length === 3) {
        const c0 = clean.charAt(0);
        const c1 = clean.charAt(1);
        const c2 = clean.charAt(2);
        clean = c0 + c0 + c1 + c1 + c2 + c2;
    }
    if (clean.length !== 6) {
        return [0.93, 0.93, 0.93];
    }
    const rHex = clean.slice(0, 2);
    const gHex = clean.slice(2, 4);
    const bHex = clean.slice(4, 6);
    const rInt = parseInt(rHex, 16);
    const gInt = parseInt(gHex, 16);
    const bInt = parseInt(bHex, 16);
    const badR = Number.isNaN(rInt);
    const badG = Number.isNaN(gInt);
    const badB = Number.isNaN(bInt);
    if (badR || badG || badB) {
        return [0.93, 0.93, 0.93];
    }
    return [rInt / 255, gInt / 255, bInt / 255];
}

// based on style.css, --tr-solid-light-1, read active light token color or pick default gray
function trResolveWavePalette(palette) {
    if (palette === "colorful") {
        return { colorMode: 1, rgb: [1.0, 1.0, 1.0] };
    }
    if (palette === "metal") {
        return { colorMode: 2, rgb: [1.0, 1.0, 1.0] };
    }
    if (palette === "green") {
        return { colorMode: 0, rgb: [0.18, 0.85, 0.35] };
    }
    if (palette === "ocean") {
        return { colorMode: 0, rgb: [0.15, 0.62, 0.95] };
    }
    if (palette === "sunset") {
        return { colorMode: 0, rgb: [0.98, 0.45, 0.25] };
    }
    const isMonoAlias = palette === "monochromatic" || palette === "mono";
    if (!isMonoAlias) {
        const isStr = typeof palette === "string";
        const isHex = isStr && palette.startsWith("#");
        if (isHex) {
            const customRgb = trParseHexRgb(palette);
            return { colorMode: 0, rgb: customRgb };
        }
    }
    const rootEl = document.documentElement;
    const rootStyle = getComputedStyle(rootEl);
    let lightToken = rootStyle.getPropertyValue("--tr-solid-light-1");
    lightToken = lightToken.trim();
    if (lightToken) {
        const monoRgb = trParseHexRgb(lightToken);
        return { colorMode: 0, rgb: monoRgb };
    }
    return { colorMode: 0, rgb: [0.93, 0.93, 0.93] };
}

function trClampUnit(val) {
    if (val < 0) {
        return 0;
    }
    if (val > 1) {
        return 1;
    }
    return val;
}

function trResolveSourceRect(source) {
    if (!source) {
        return null;
    }
    if (typeof source.getBoundingClientRect === "function") {
        return source.getBoundingClientRect();
    }
    const currentEl = source.current;
    if (currentEl && typeof currentEl.getBoundingClientRect === "function") {
        return currentEl.getBoundingClientRect();
    }
    if (typeof source.left === "number" && typeof source.top === "number") {
        return source;
    }
    return null;
}

// ive looked up on the internet on this one, measure wave start from fixed default or cursor when follow mode active
function trMeasureWaveOrigin(rootEl, source, pointerEvent, explicitOrigin, followCursor) {
    if (explicitOrigin && typeof explicitOrigin.x === "number" && typeof explicitOrigin.y === "number") {
        return {
            x: trClampUnit(explicitOrigin.x),
            y: trClampUnit(explicitOrigin.y)
        };
    }
    const useCursor = typeof followCursor === "boolean" ? followCursor : WAVE_FOLLOW_CURSOR;
    if (!useCursor) {
        return { x: WAVE_ORIGIN_X, y: WAVE_ORIGIN_Y };
    }
    const rootRect = rootEl.getBoundingClientRect();
    const w = rootRect.width;
    const h = rootRect.height;
    if (w <= 0 || h <= 0) {
        return { x: WAVE_ORIGIN_X, y: WAVE_ORIGIN_Y };
    }

    const activePtr = pointerEvent && typeof pointerEvent.clientX === "number" ? pointerEvent : lastCursorPos;
    if (activePtr && typeof activePtr.clientX === "number" && typeof activePtr.clientY === "number") {
        const px = (activePtr.clientX - rootRect.left) / w;
        const py = (activePtr.clientY - rootRect.top) / h;
        return {
            x: trClampUnit(px),
            y: trClampUnit(py)
        };
    }

    const srcRect = trResolveSourceRect(source);
    if (srcRect) {
        const centerX = srcRect.left + srcRect.width * 0.5;
        const centerY = srcRect.top + srcRect.height * 0.5;
        const ox = (centerX - rootRect.left) / w;
        const oy = (centerY - rootRect.top) / h;
        return {
            x: trClampUnit(ox),
            y: trClampUnit(oy)
        };
    }

    return { x: WAVE_ORIGIN_X, y: WAVE_ORIGIN_Y };
}

function trResolveWaveMode(typeName) {
    if (typeName === "vertical") {
        return 1;
    }
    if (typeName === "horizontal") {
        return 2;
    }
    return 0;
}

// <patch-1>
// ive looked up on the internet on this one, evaluate single axis of cubic bezier curve from four control point
function trSampleCubicBezier(u, p1, p2) {
    const inv = 1 - u;
    const invSq = inv * inv;
    const uSq = u * u;
    let term1 = 3 * invSq;
    term1 = term1 * u;
    term1 = term1 * p1;
    let term2 = 3 * inv;
    term2 = term2 * uSq;
    term2 = term2 * p2;
    const term3 = uSq * u;
    let sum = term1 + term2;
    sum = sum + term3;
    return sum;
}

function trEaseWaveProgress(t, x1, y1, x2, y2) {
    const clamped = trClampUnit(t);
    if (clamped <= 0) {
        return 0;
    }
    if (clamped >= 1) {
        return 1;
    }
    // ive looked up on the internet on this one, find bezier curve spot for current time using binary search
    let low = 0;
    let high = 1;
    let mid = clamped;
    for (let i = 0; i < 16; i += 1) {
        mid = low + high;
        mid = mid * 0.5;
        const guessX = trSampleCubicBezier(mid, x1, x2);
        if (guessX < clamped) {
            low = mid;
        } else {
            high = mid;
        }
    }
    const easedY = trSampleCubicBezier(mid, y1, y2);
    return easedY;
}

// ive looked up on the internet on this one, mimic iphone airdrop gather pull then outward bloom before settling back to normal size
function trComputeAirdropScale(rawT) {
    const t = trClampUnit(rawT);
    if (t <= 0 || t >= 1) {
        return 1;
    }
    if (t < 0.22) {
        const local = t / 0.22;
        const s = Math.sin(local * Math.PI * 0.5);
        return 1 - WAVE_AIRDROP_PULL_SCALE * s;
    }
    if (t < 0.50) {
        const local = (t - 0.22) / 0.28;
        const smooth = local * local * (3 - 2 * local);
        const startVal = 1 - WAVE_AIRDROP_PULL_SCALE;
        const peakVal = 1 + WAVE_AIRDROP_BLOOM_SCALE;
        const span = peakVal - startVal;
        return startVal + span * smooth;
    }
    const local = (t - 0.50) / 0.50;
    const inv = 1 - local;
    const easeOut = 1 - inv * inv * inv;
    const peakVal = 1 + WAVE_AIRDROP_BLOOM_SCALE;
    return peakVal - WAVE_AIRDROP_BLOOM_SCALE * easeOut;
}
// </patch-1>

// ive looked up on the internet on this one, draw simple fade on standard canvas when webgl2 fail
function trDrawWaveFallback2D(ctx2d, canvas, imgFrom, imgTo, progress) {
    const w = canvas.width;
    const h = canvas.height;
    ctx2d.clearRect(0, 0, w, h);
    if (imgFrom) {
        ctx2d.globalAlpha = 1 - progress;
        ctx2d.drawImage(imgFrom, 0, 0, w, h);
    }
    if (imgTo) {
        ctx2d.globalAlpha = progress;
        ctx2d.drawImage(imgTo, 0, 0, w, h);
    }
    ctx2d.globalAlpha = 1;
}

// based on components.js, trEl, build isolated container layer and keep overlay control sharp
function trDistortionWave(options) {
    const opts = options || {};
    const waveStyle = opts.waveStyle || {};
    let rootCls = "distortion-wave";
    if (opts.className) {
        rootCls = rootCls + " " + opts.className;
    }
    const root = trEl("div", rootCls);
    if (opts.cornerRadius !== undefined && opts.cornerRadius !== null) {
        const rawRadius = opts.cornerRadius;
        const radiusText = String(rawRadius);
        const radiusVal = typeof rawRadius === "number" ? radiusText + "px" : radiusText;
        root.style.borderRadius = radiusVal;
    }

    const rawRevealedContent = opts.revealedContent;
    const hasRevealedContent = Boolean(rawRevealedContent);
    const rawRevealed = opts.revealed;
    let isRevealed = Boolean(rawRevealed);

    let fromCls = "distortion-wave-view";
    if (hasRevealedContent && isRevealed) {
        fromCls = fromCls + " is-hidden";
    }
    const fromView = trEl("div", fromCls);
    trAppend(fromView, opts.children);
    root.appendChild(fromView);

    let toView = null;
    if (hasRevealedContent) {
        let toCls = "distortion-wave-view";
        if (!isRevealed) {
            toCls = toCls + " is-hidden";
        }
        toView = trEl("div", toCls);
        trAppend(toView, opts.revealedContent);
        root.appendChild(toView);
    }

    const canvas = trEl("canvas", "distortion-wave-canvas");
    root.appendChild(canvas);

    const overlayLayer = trEl("div", "distortion-wave-overlay");
    if (opts.overlay) {
        trAppend(overlayLayer, opts.overlay);
    }
    root.appendChild(overlayLayer);

    let renderer = null;
    let ctx2d = null;
    let texFrom = null;
    let texTo = null;
    let imgFrom = null;
    let imgTo = null;
    let rafId = 0;
    let progress = isRevealed ? 1 : 0;
    let particleTail = 0;
    let particleTime = 0;
    let activeSource = opts.source || null;
    let activeOrigin = opts.origin || null;
    let activeFollowCursor = typeof opts.followCursor === "boolean" ? opts.followCursor : WAVE_FOLLOW_CURSOR;
    let activeType = opts.type || "center";
    let activePalette = opts.palette || "monochromatic";
    const initialSpeed = typeof opts.speed === "number" ? opts.speed : 1;
    let activeSpeed = initialSpeed > 0 ? initialSpeed : 1;

    function syncDomVisibility(revealedState) {
        if (!hasRevealedContent) {
            fromView.classList.remove("is-hidden");
            return;
        }
        if (revealedState) {
            fromView.classList.add("is-hidden");
            if (toView) {
                toView.classList.remove("is-hidden");
            }
        } else {
            fromView.classList.remove("is-hidden");
            if (toView) {
                toView.classList.add("is-hidden");
            }
        }
    }

    function clearTextures() {
        if (renderer && renderer.gl) {
            if (texFrom) {
                renderer.gl.deleteTexture(texFrom);
                texFrom = null;
            }
            if (texTo) {
                renderer.gl.deleteTexture(texTo);
                texTo = null;
            }
        }
    }

    // ive looked up on the internet on this one, capture view picture and upload texture before wave start
    function prepare() {
        const rect = root.getBoundingClientRect();
        const rawW = rect.width > 0 ? rect.width : 320;
        const rawH = rect.height > 0 ? rect.height : 240;
        const dprRaw = window.devicePixelRatio || 1;
        let dpr = dprRaw > WAVE_MAX_DPR ? WAVE_MAX_DPR : dprRaw;
        if (dpr < 1) {
            dpr = 1;
        }
        const maxSide = Math.max(rawW, rawH);
        if (maxSide * dpr > WAVE_MAX_TEXTURE_DIM) {
            dpr = WAVE_MAX_TEXTURE_DIM / maxSide;
        }
        const scaledW = rawW * dpr;
        const scaledH = rawH * dpr;
        const pxW = Math.round(scaledW);
        const pxH = Math.round(scaledH);
        canvas.width = pxW;
        canvas.height = pxH;

        if (!renderer && !ctx2d) {
            renderer = trCreateWaveRenderer(canvas);
            if (!renderer) {
                ctx2d = canvas.getContext("2d");
            }
        }

        const fromPromise = trCaptureNodeToImage(fromView, rawW, rawH, pxW, pxH);
        const toTarget = toView || fromView;
        const toPromise = trCaptureNodeToImage(toTarget, rawW, rawH, pxW, pxH);
        const pair = [fromPromise, toPromise];
        const allCaptured = Promise.all(pair);

        return allCaptured.then(function (images) {
            imgFrom = images[0];
            imgTo = images[1];
            if (renderer && renderer.gl) {
                clearTextures();
                texFrom = trUploadWaveTexture(renderer.gl, imgFrom);
                texTo = trUploadWaveTexture(renderer.gl, imgTo);
            }
            return true;
        });
    }

    function buildCachedFrameState(origin) {
        const paletteInfo = trResolveWavePalette(activePalette);
        const modeCode = trResolveWaveMode(activeType);
        const amplitude = typeof waveStyle.amplitude === "number" ? waveStyle.amplitude : WAVE_AMPLITUDE;
        const rippleFreq = typeof waveStyle.rippleFreq === "number" ? waveStyle.rippleFreq : WAVE_RIPPLE_FREQ;
        const rippleMix = typeof waveStyle.rippleMix === "number" ? waveStyle.rippleMix : WAVE_RIPPLE_MIX;
        const aberration = typeof waveStyle.aberration === "number" ? waveStyle.aberration : WAVE_ABERRATION;
        const rimWidth = typeof waveStyle.rimWidth === "number" ? waveStyle.rimWidth : WAVE_RIM_WIDTH;
        const blurAmount = typeof waveStyle.blurAmount === "number" ? waveStyle.blurAmount : WAVE_BLUR_AMOUNT;

        const glowIntensity = typeof waveStyle.glowIntensity === "number" ? waveStyle.glowIntensity : WAVE_GLOW_INTENSITY;
        const glowSpread = typeof waveStyle.glowSpread === "number" ? waveStyle.glowSpread : WAVE_GLOW_SPREAD;
        const coreSpark = typeof waveStyle.coreSpark === "number" ? waveStyle.coreSpark : WAVE_CORE_SPARK;
        const meshSharpness = typeof waveStyle.meshSharpness === "number" ? waveStyle.meshSharpness : WAVE_MESH_SHARPNESS;
        const meshFlow = typeof waveStyle.meshFlow === "number" ? waveStyle.meshFlow : WAVE_MESH_FLOW;
        const edgeLightIntensity = typeof waveStyle.edgeLightIntensity === "number" ? waveStyle.edgeLightIntensity : WAVE_EDGE_LIGHT_INTENSITY;
        const edgeLightWidth = typeof waveStyle.edgeLightWidth === "number" ? waveStyle.edgeLightWidth : WAVE_EDGE_LIGHT_WIDTH;
        const edgeCrestBoost = typeof waveStyle.edgeCrestBoost === "number" ? waveStyle.edgeCrestBoost : WAVE_EDGE_CREST_BOOST;
        const edgeHaloPower = typeof waveStyle.edgeHaloPower === "number" ? waveStyle.edgeHaloPower : WAVE_EDGE_HALO_POWER;
        const rawParticles = typeof waveStyle.particleCount === "number" ? waveStyle.particleCount : WAVE_PARTICLE_COUNT;
        const particleCount = Math.round(rawParticles);
        const particleSize = typeof waveStyle.particleSize === "number" ? waveStyle.particleSize : WAVE_PARTICLE_SIZE;
        const particleHalo = typeof waveStyle.particleHalo === "number" ? waveStyle.particleHalo : WAVE_PARTICLE_HALO;
        const particleGlow = typeof waveStyle.particleGlow === "number" ? waveStyle.particleGlow : WAVE_PARTICLE_GLOW;
        const particleDrift = typeof waveStyle.particleDrift === "number" ? waveStyle.particleDrift : WAVE_PARTICLE_DRIFT;
        const particleEase = typeof waveStyle.particleEase === "number" ? waveStyle.particleEase : WAVE_PARTICLE_EASE;
        const rgb = paletteInfo.rgb;

        return {
            texFrom: texFrom,
            texTo: texTo,
            progress: progress,
            originX: origin.x,
            originY: origin.y,
            mode: modeCode,
            tintR: rgb[0],
            tintG: rgb[1],
            tintB: rgb[2],
            colorMode: paletteInfo.colorMode,
            amplitude: amplitude,
            rippleFreq: rippleFreq,
            rippleMix: rippleMix,
            aberration: aberration,
            rimWidth: rimWidth,
            blurAmount: blurAmount,
            glowIntensity: glowIntensity,
            glowSpread: glowSpread,
            coreSpark: coreSpark,
            meshSharpness: meshSharpness,
            meshFlow: meshFlow,
            edgeLightIntensity: edgeLightIntensity,
            edgeLightWidth: edgeLightWidth,
            edgeCrestBoost: edgeCrestBoost,
            edgeHaloPower: edgeHaloPower,
            particleCount: particleCount,
            particleSize: particleSize,
            particleHalo: particleHalo,
            particleGlow: particleGlow,
            particleDrift: particleDrift,
            particleEase: particleEase
        };
    }

    function drawFrameWithState(frameState) {
        if (renderer && texFrom && texTo) {
            frameState.texFrom = texFrom;
            frameState.texTo = texTo;
            frameState.progress = progress;
            frameState.particleTail = particleTail;
            frameState.particleTime = particleTime;
            renderer.drawFrame(frameState);
        } else if (ctx2d) {
            trDrawWaveFallback2D(ctx2d, canvas, imgFrom, imgTo, progress);
        }
    }

    function stopLoop() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
        }
        canvas.style.transform = "";
        canvas.style.transformOrigin = "";
    }

    function isReducedMotion() {
        if (opts.reducedMotion === true) {
            return true;
        }
        if (typeof window.matchMedia === "function") {
            const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
            if (mq && mq.matches) {
                return true;
            }
        }
        return false;
    }

    function animateTo(targetRevealed, pointerEvent) {
        stopLoop();
        if (pointerEvent && pointerEvent.currentTarget && !opts.source) {
            activeSource = pointerEvent.currentTarget;
        }
        const targetProgress = targetRevealed ? 1 : 0;
        const startProgress = progress;

        if (isReducedMotion()) {
            progress = targetProgress;
            isRevealed = targetRevealed;
            syncDomVisibility(isRevealed);
            canvas.classList.remove("is-active");
            if (opts.onFinish) {
                opts.onFinish(isRevealed);
            }
            return;
        }

        const origin = trMeasureWaveOrigin(root, activeSource, pointerEvent, activeOrigin, activeFollowCursor);
        const hasCustomDuration = typeof waveStyle.duration === "number";
        const baseDuration = hasCustomDuration ? waveStyle.duration : WAVE_DURATION;
        // <patch-1>
        const defBx1 = WAVE_AIRDROP_EXPERIMENTAL ? WAVE_AIRDROP_BEZIER_X1 : WAVE_BEZIER_X1;
        const defBy1 = WAVE_AIRDROP_EXPERIMENTAL ? WAVE_AIRDROP_BEZIER_Y1 : WAVE_BEZIER_Y1;
        const defBx2 = WAVE_AIRDROP_EXPERIMENTAL ? WAVE_AIRDROP_BEZIER_X2 : WAVE_BEZIER_X2;
        const defBy2 = WAVE_AIRDROP_EXPERIMENTAL ? WAVE_AIRDROP_BEZIER_Y2 : WAVE_BEZIER_Y2;
        const bx1 = typeof waveStyle.bezierX1 === "number" ? waveStyle.bezierX1 : defBx1;
        const by1 = typeof waveStyle.bezierY1 === "number" ? waveStyle.bezierY1 : defBy1;
        const bx2 = typeof waveStyle.bezierX2 === "number" ? waveStyle.bezierX2 : defBx2;
        const by2 = typeof waveStyle.bezierY2 === "number" ? waveStyle.bezierY2 : defBy2;
        // </patch-1>
        const readyPromise = prepare();

        readyPromise.then(function () {
            const cachedState = buildCachedFrameState(origin);
            drawFrameWithState(cachedState);
            if (WAVE_AIRDROP_EXPERIMENTAL) {
                const oxPct = Math.round(origin.x * 100);
                const oyPct = Math.round(origin.y * 100);
                canvas.style.transformOrigin = oxPct + "% " + oyPct + "%";
                canvas.style.transform = "scale(1)";
            }
            canvas.classList.add("is-active");
            let lastTime = null;
            let elapsed = 0;

            // ive looked up on the internet on this one, scale frame time by active speed factor so wave move slower or faster
            function step(now) {
                if (lastTime === null) {
                    lastTime = now;
                }
                const dtRaw = now - lastTime;
                const dt = dtRaw > 48 ? 48 : dtRaw;
                lastTime = now;
                const safeSpeed = activeSpeed > 0 ? activeSpeed : 1;
                const scaledDt = dt * safeSpeed;
                elapsed = elapsed + scaledDt;
                const rawT = baseDuration > 0 ? elapsed / baseDuration : 1;
                const totalDuration = baseDuration + WAVE_PARTICLE_TAIL_MS;
                particleTime = totalDuration > 0 ? Math.min(1, elapsed / totalDuration) : 1;

                if (rawT < 1) {
                    // <patch-1>
                    const easedT = trEaseWaveProgress(rawT, bx1, by1, bx2, by2);
                    // </patch-1>
                    const travel = targetProgress - startProgress;
                    const offset = travel * easedT;
                    progress = startProgress + offset;
                    particleTail = 0;
                    if (WAVE_AIRDROP_EXPERIMENTAL) {
                        const sc = trComputeAirdropScale(rawT);
                        canvas.style.transform = "scale(" + sc.toFixed(4) + ")";
                    }
                    drawFrameWithState(cachedState);
                    rafId = requestAnimationFrame(step);
                } else {
                    if (WAVE_AIRDROP_EXPERIMENTAL) {
                        canvas.style.transform = "";
                    }
                    progress = targetProgress;
                    const tailElapsed = elapsed - baseDuration;
                    const tailRatio = WAVE_PARTICLE_TAIL_MS > 0 ? tailElapsed / WAVE_PARTICLE_TAIL_MS : 1;
                    particleTail = tailRatio < 1 ? tailRatio : 1;
                    drawFrameWithState(cachedState);

                    if (tailRatio < 1) {
                        rafId = requestAnimationFrame(step);
                    } else {
                        rafId = 0;
                        particleTail = 0;
                        particleTime = 0;
                        isRevealed = targetRevealed;
                        syncDomVisibility(isRevealed);
                        canvas.classList.remove("is-active");
                        if (opts.onFinish) {
                            opts.onFinish(isRevealed);
                        }
                    }
                }
            }

            rafId = requestAnimationFrame(step);
        });
    }

    function play(pointerEvent) {
        animateTo(true, pointerEvent);
    }

    function reverse(pointerEvent) {
        animateTo(false, pointerEvent);
    }

    function reset() {
        stopLoop();
        isRevealed = false;
        progress = 0;
        syncDomVisibility(false);
        canvas.classList.remove("is-active");
    }

    function setRevealed(nextState, pointerEvent) {
        const target = Boolean(nextState);
        animateTo(target, pointerEvent);
    }

    function setType(nextType) {
        activeType = nextType || "center";
    }

    function setPalette(nextPalette) {
        activePalette = nextPalette || "monochromatic";
    }

    function setOrigin(nextOrigin) {
        activeOrigin = nextOrigin || null;
    }

    function setSpeed(nextSpeed) {
        const parsed = Number(nextSpeed);
        const isBad = Number.isNaN(parsed);
        const isPositive = !isBad && parsed > 0;
        activeSpeed = isPositive ? parsed : 1;
    }

    function setStyle(nextStyle) {
        if (!nextStyle) {
            return;
        }
        const keys = Object.keys(nextStyle);
        const keyCount = keys.length;
        for (let i = 0; i < keyCount; i += 1) {
            const k = keys[i];
            waveStyle[k] = nextStyle[k];
        }
    }

    return {
        el: root,
        play: play,
        reverse: reverse,
        reset: reset,
        prepare: prepare,
        setRevealed: setRevealed,
        setType: setType,
        setPalette: setPalette,
        setOrigin: setOrigin,
        setSpeed: setSpeed,
        setStyle: setStyle
    };
}

// ive looked up on the internet on this one, mirror live input and select value onto cloned element attribute before snapshot
