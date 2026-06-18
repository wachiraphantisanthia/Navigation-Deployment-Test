# WebAvatar Realtime Modes Integration Guide

This guide covers the integration of the two **realtime voice modes** supported by the WebAvatar chat widget: `realtime-fullscreen` and `realtime-widget`. These modes bypass the standard chat history panel to provide a fluid, low-latency voice-to-voice experience powered by the **Gemini Live API** via WebSockets, coupled with a 3D VRM avatar that performs real-time lip-sync and contextual animations.

---

## Table of Contents

1. [The Two Realtime Modes](#1-the-two-realtime-modes)
2. [Quick Start & Embed Snippet](#2-quick-start--embed-snippet)
3. [Configuration Reference (`window.ChatWidgetConfig`)](#3-configuration-reference-windowchatwidgetconfig)
4. [Built-in Tools & Site Control](#4-built-in-tools--site-control)
5. [Built-in UI Controls](#5-built-in-ui-controls)
   - [Pulsing Call Button](#pulsing-call-button)
   - [Volume Slider](#volume-slider)
   - [Expand/Contract Toggle](#expandcontract-toggle)
   - [Speech Bubble & Dynamic Camera Panning](#speech-bubble--dynamic-camera-panning)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. The Two Realtime Modes

The widget can be configured in one of two distinct display modes for the voice-to-voice experience:

### 1. `realtime-fullscreen`

- **Layout**: The 3D avatar fills the entire viewport immediately.
- **Initialization**: Auto-initializes the WebGL canvas and loads the avatar model on page load.
- **Camera Behavior**: Shifting is fully enabled. The camera pans up/down dynamically as speech transcriptions grow to keep the avatar's face/mouth visible above the text.
- **Best For**: Dedicated voice interface landing pages (e.g., `live.html`).

### 2. `realtime-widget`

- **Layout**: The avatar appears in the bottom-right corner as a floating widget.
- **Initialization**: Lazy loads the avatar widget script and model only _after_ the user clicks the "Connect" button.
- **Camera Behavior**: Camera shifting is disabled when minimized.
- **Expand/Contract**: Displays an expand button in the control stack that animates the widget to a full-viewport layout using a `ResizeObserver` to prevent canvas squishing or pixelation during transitions.
- **Best For**: Adding a voice assistant overlay on top of an existing page.

---

## 2. Quick Start & Embed Snippet

Paste the universal snippet before `</body>`. To configure the realtime experience, set the `mode` parameter to either `"realtime-fullscreen"` or `"realtime-widget"` in the config object.

```html
<script>
  window.ChatWidgetConfig = {
    mode: "realtime-widget", // "realtime-fullscreen" | "realtime-widget"
    widgetId: "YOUR_WIDGET_ID", // https://webavatar.didthat.cc/realtime-dashboard
    avatarUrl: "Botnoi", // direct link to .vrm or see preset list here https://raw.githubusercontent.com/S25214/Web-Avatar/refs/heads/main/manifest.json
    greetingInstruction: "Greet the user warmly in Thailand.", // if not presetnt or empty, default = "Please greet the user."
  };
  (function () {
    if (document.getElementById("webavatar-jssdk")) return;
    var s = document.createElement("script");
    s.id = "webavatar-jssdk";
    s.src = "https://webavatar.didthat.cc/chat-widget.js";
    s.async = true;
    (document.head || document.body).appendChild(s);
  })();
</script>
```

### Embedding in a Custom Parent Container

If you want the widget, controls, and canvas to render within a specific element on your page (rather than covering the entire viewport or floating at the bottom-right corner), configure the `container` property as a CSS selector string or direct `HTMLElement` reference:

```javascript
window.ChatWidgetConfig = {
  mode: "realtime-fullscreen",
  widgetId: "YOUR_WIDGET_ID",
  container: "#my-avatar-box", // Or direct element reference
};
```

#### SPA Frameworks (React, Next.js, Vue, Svelte)

In component-based frameworks, assign the direct DOM element reference (e.g., from React `useRef` or Vue template ref) to the `container` property inside the component's mount lifecycle hook. Call `window.WebAvatar.disconnect()` on unmount/teardown to cleanly release WebGL and WebAudio context resources.

---

## 3. Configuration Reference (`window.ChatWidgetConfig`)

Configure these properties in `window.ChatWidgetConfig` (Priority source for all frameworks):

| Config Key            | Data Attribute              | Type                      | Default    | Description                                                                                                                                                                                                |
| --------------------- | --------------------------- | ------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`                | `data-mode`                 | `string`                  | `"panel"`  | Display mode. Set to `"realtime-fullscreen"` or `"realtime-widget"`.                                                                                                                                       |
| `widgetId`            | `data-widget-id`            | `string`                  | —          | **Required**. Used to authorize your domain, fetch settings, and generate an ephemeral WebSocket token.                                                                                                    |
| `avatarUrl`           | `data-avatar-url`           | `string`                  | `"Botnoi"` | Built-in model name (e.g., `"Botnoi"`, `"Kitagawa"`) or absolute URL to a `.vrm` file.                                                                                                                     |
| `greetingInstruction` | `data-greeting-instruction` | `string`                  | —          | Custom system instruction injected only when greeting the user (e.g., `[SYSTEM] Please welcome the customer to CMU.`).                                                                                     |
| `container`           | `data-container`            | `string` or `HTMLElement` | —          | Optional. Selector string or direct DOM element. When specified, forces the widget, controls, and canvas to render absolutely inside this parent element instead of overlaying the document viewport/body. |

---

## 4. Built-in Tools & Site Control

If enabled in your widget configuration on the dashboard, Gemini has access to client-side tools to interact with the page:

1. **`scan_current_page`**: Scans the DOM for semantic HTML elements and returns available routes (SPA pages), clickable sections, input fields, buttons, and dropdowns.
2. **`navigate_parent_site`**: Allows the avatar to navigate pages on your site. Safe relative routes are navigated directly, or dispatched as a cancelable CustomEvent (`webavatar-navigate`) so single-page apps (React, Next.js, Vue) can handle routing programmatically.
3. **`scroll_to_element`**: Focuses the viewport on an element (by ID or class selector) and triggers a temporary purple glow effect to highlight it.
4. **`fill_form_fields`**: Programmatically fills inputs, textareas, or dropdown selections compatibly with framework event handlers (React/Vue).
5. **`click_element`**: Simulates a click event on buttons or toggle summaries.
6. **`set_avatar_animation`**: Changes the avatar's active gesture or sets temporary emotions (`happy`, `sad`, `angry`, `surprised`, `relaxed`, `idle`).

---

## 5. Built-in UI Controls

The realtime UI is composed of minimal floating overlays built using modern Glassmorphic styling.

### Pulsing Call Button

The main toggle button (`#bcw-rt-call-btn`) handles the connection lifecycle. It changes color and triggers ambient pulse rings based on the active state:

- **Connecting**: Pulse rings grow continuously, status reads "Connecting to AI...".
- **Listening** (`.bcw-rt-glow-listening`): Slow, breathing cyan/blue glow. Mic is active.
- **Speaking** (`.bcw-rt-glow-speaking`): Faster, pulsating violet/purple glow while the avatar is voicing a reply.

### Volume Slider

Hovering (desktop) or tapping (mobile) the volume button displays a slide-out slider. Moving the slider updates the avatar speaker output volume directly via `WebAvatar.setVolume(0-1)`.

### Expand/Contract Toggle

_(Available in `realtime-widget` mode only)_
Toggles the widget container between minimized (bottom-right panel) and fullscreen overlays. It dispatches a window `resize` event on completion to force the WebGL renderer to adjust its boundaries cleanly.

### Speech Bubble & Dynamic Camera Panning

A floating speech bubble (`.bcw-rt-bubble`) displays the live transcription of the bot's speech.

- **Fullscreen Camera Shift**: To prevent the speech bubble from covering the avatar's face, the camera moves upwards based on the height of the text:
  $$\text{Shift } Y = \min(0.6\text{m}, \text{Lines} \times 0.04\text{m})$$
- **Fading**: When the bot stops speaking, the bubble fades out after `1.0s` and the camera smoothly resets to the default face-focus coordinate.

---

## 6. Troubleshooting

### 1. Stuck on "Connecting to AI..."

- **Origin Mismatch**: Verify that your current domain (including protocol and port, e.g. `https://mywebsite.com`) is added to the whitelisted domains in your WebAvatar dashboard settings for this `widgetId`.
- **Token Expired**: Ephemeral connection tokens are single-use and expire if the connection takes longer than 60 seconds to complete. Click connect again to request a new token.

### 2. Microphone Access Blocked

- **HTTPS Required**: Modern browsers disable microphone APIs on non-secure origins. Your website must be served over `HTTPS` (except for `localhost`).
- **In-App Webview Restrictions**: In-app browsers (such as within LINE, Facebook Messenger, or WeChat) frequently restrict microphone permissions. Catch the permission error to prompt users to open the page in their device's default web browser (Safari/Chrome).

### 3. Autoplay Restrictions / Audio is Muted

- **User Gesture Required**: Modern browsers block audio output until a user interacts with the page. The connection starts on the click of the Call Button, which serves as the required user gesture to unmute the audio context.

### 4. Site Tools (e.g., navigation, form-filling) Fail

- **Same-Origin Policy**: Navigation actions are restricted to relative same-origin paths. External URLs (e.g., `google.com`) are rejected for security.
- **Element Selector Matching**: Ensure target inputs, buttons, and elements on your page have clean and consistent HTML tag names, class names, or IDs so they can be parsed correctly by the DOM scanner and targeted by the AI.
