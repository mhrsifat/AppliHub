Depth to Infinity – Portfolio App Prompt

1. Multi-Scene Transition Logic

On launch, randomly select one intro sequence with weighted probability:

Ocean → Space (60%), Deep Forest → Space (20%), Fire → Space (15%), Space-only (5%).


Animations: Fade out the first scene (~200–300ms, per Material guidelines), then fade/scale in the space scene. For example, scale elements from 80%→100% to avoid abrupt starts. Particle systems (water, leaves, flames) should smoothly transition (e.g. fade out or accelerate).

After transition, clean up WebGL: call renderer.forceContextLoss() and null out the context/DOM to prevent leaks. Use seeded randomness so the same probabilities yield reproducible behavior.


{
  "SceneTransition": {
    "introPaths": [
      {"from":"Ocean", "to":"Space", "prob":0.60},
      {"from":"DeepForest", "to":"Space", "prob":0.20},
      {"from":"Fire", "to":"Space", "prob":0.15},
      {"from":"Space", "to":"Space", "prob":0.05}
    ],
    "animations": {
      "fade": {"duration": 250, "easing": "ease-in-out"},
      "scale": {"from":0.8, "to":1.0, "duration": 250},
      "particleFade": {"duration": 200}
    },
    "cleanup": {"method": "renderer.forceContextLoss()", "target": "prevGLScene"}
  }
}

2. Main App Structure

Flow: Intro (e.g. Ocean) → transition → Space (Hub) → Projects (Planets) → Blog → Testimonials → Contact. Navigation can be scroll-linked or via a fixed navbar.

Place the user avatar at the center of the space hub. Clicking the avatar opens social media links. Clicking empty space may trigger random events (see section 8).

Transitions: Use smooth fades/slides (~250ms) between sections. Maintain context (e.g. keep avatar visible across space-related sections).


{
  "AppStructure": {
    "sections": ["SpaceHub", "Projects", "Blog", "Testimonials", "Contact"],
    "navigation": {"type": "scrollSpy", "sectionsAnchorIds": [true,true,true,true,true]},
    "avatar": {"position": "center", "interactions": ["openLinks", "maybeFunFact"]}
  }
}

3. Blog Section – Floating 3D BlogCards

Design: Each BlogCard floats in 3D space with a soft glow. On hover, apply a subtle 3D tilt (e.g. rotateX/Y by ~±5°) and intensify the glow.

Content: Show title, image (lazy-loaded), excerpt. Include Vote buttons and a Comment count. Below the cards, a comment form with a “verify-human” orb that must be long-pressed to post.

Interactions: Hover = tilt + glow. Click title/image = open BlogDetail. Upvote/downvote buttons (keyboard-focusable) adjust counts.

Responsiveness: Use a grid (1 column on mobile, up to 3 on desktop).

Accessibility: Mark each card as an article (role="article" or <article>) since it’s standalone content. Use aria-live="polite" on dynamic elements (e.g. updating counts) so screen readers announce changes.


{
  "BlogCard": {
    "layout": {"floatInSpace": true, "gridColumns": [1,2,3]},
    "styleTokens": {"bgColor": "surface", "textColor": "onSurface", "glow": "highlight"},
    "animations": {
      "enter": {"opacity": 0, "opacityEnd": 1, "duration": 250},
      "hoverTilt": {"rotateX":5, "rotateY":-5, "duration": 150}
    },
    "actions": ["openDetail", "voteUp", "voteDown"],
    "content": ["title","image","excerpt","commentCount"],
    "accessibility": {"role": "article", "ariaLive": "polite"}
  }
}

4. BlogDetail View

Hero: Large header image with title text overlaid.

Reading Progress: A fixed progress bar at top showing scroll percentage.

Layout: Main content in an <article>; a sidebar (<aside>) for table of contents or author info.

Related Posts: Display a set of related BlogCards at end; lazy-load these for performance.

Lazy Loading: Only load heavy content (images, videos) when in view.

Accessibility: Use semantic headings (<h1>, <h2>, etc.) and landmarks. Mark related posts region with role="region" and an accessible name.


{
  "BlogDetail": {
    "hero": {"image": "url", "title": "String"},
    "progressBar": {"position": "top", "color": "accent"},
    "sidebar": {"position": "right", "contents": ["toc","authorInfo"]},
    "related": {"cards": 3, "lazyLoad": true},
    "accessibility": {"role": "article", "mainContent": true}
  }
}
5. Projects / Planets Section

Display each project as an orbiting planet in 3D space.
Each planet shows the project image or icon at its core, with small tech badges orbiting around it (e.g. React, JS, laravel, vuejs).

Filter Chips (Top Bar)
Include clickable Material-style filter chips: JavaScript, React, UI/UX, Backend.
These act as toggles — when one or more are active, only matching planets stay visible.
Filter transitions fade or scale smoothly when projects appear/disappear.

Interaction & Accessibility
On hover or keyboard focus, show a tooltip with the project’s name and a short description.
Tooltips must be keyboard-accessible and linked with aria-describedby.
Each planet acts as an accessible figure (role="figure", aria-label="Project Title").

Animation
Planets and orbiting badges rotate continuously at varying speeds and radii (orbitCenter: spaceHub, orbitRadius: variable).
The motion is calm and persistent, never distracting.

Modal on Click
When a planet is clicked, open a mostly transparent modal:

Project title at the top

Main picture centered

Description near the bottom

Live / GitHub / Vercel / Other links shown neatly in a corner
The modal background randomly shifts color each time it opens (soft hue variation).


JSON Spec

{
  "ProjectPlanet": {
    "layout": { "orbitCenter": "spaceHub", "orbitRadius": "variable" },
    "filters": { "chips": ["JavaScript","React","UI/UX","Backend"], "type": "toggle" },
    "tooltip": { "trigger": "hover/focus", "ariaDescribedBy": true },
    "animations": { "orbit": "continuous", "fadeIn": 300 },
    "accessibility": { "role": "figure", "ariaLabel": "Project Title" },
    "modal": { "style": "transparent", "colorMode": "random" }
  }
}


6. Testimonials Section

Floating TestimonialCards positioned randomly (but seeded for consistency). Each card shows an avatar, person’s name/role, message, and rating (e.g. stars).

Animations: Cards fade/scale into place on load.

Accessibility: Use <blockquote> or role="complementary". Each card should have an accessible name (e.g. “Testimonial by [name]”).


{
  "TestimonialCard": {
    "layout": {"float": true, "positionsSeed": 42},
    "styleTokens": {"avatarSize": 48, "bgColor": "surfaceVariant"},
    "animations": {"enter": {"opacity":0, "opacityEnd":1, "duration": 300}},
    "content": ["avatar","name","role","rating","message"],
    "accessibility": {"role": "complementary", "ariaLabel": "Testimonial from [name]"}
  }
}

7. Avatar Interaction

The central avatar (user’s profile) is clickable. On click: open social links (GitHub, LinkedIn, etc.). Also, with a set probability (profileFunFactProbability, e.g. 20%), display a fun fact in a speech-bubble overlay.

Animation: Slight idle animation (e.g. slow breathing or gentle float). On click, a quick scale or flip.

Accessibility: Treat avatar as a button (role="button", tabindex=0) if not using <button>. Provide aria-label="Profile Avatar - click for links or fun fact".


{
  "AvatarFloating": {
    "size": 150,
    "actions": {"onClick": ["openSocialLinks","maybeShowFunFact"]},
    "tokens": {"outlineColor": "primary", "hoverScale": 1.1},
    "animations": {"idle": "breathing", "click": {"scale": 0.9, "duration": 100}},
    "accessibility": {"role": "button", "tabIndex": 0, "ariaLabel": "User avatar"}
  }
}

8. Random Event Reveal

Clicking empty space in the space scene has an 8% chance to reveal a random event card. This can be a quote, fun fact, or brief phrase.

Display: The card appears with a pulse animation, and text types out character-by-character. If user has prefers-reduced-motion, skip the typing and show text immediately.

Card positions itself to avoid covering UI (e.g. bottom corner). It should be dismissible (click or auto-hide).

Use aria-live="polite" on the card so screen readers announce it.


{
  "RandomEventCard": {
    "triggerChance": 0.08,
    "types": ["quote","fact","message"],
    "animation": {"pulse": true, "typingEffect": true},
    "accessibility": {"role": "status", "ariaLive": "polite"}
  }
}

9. Stars & Visuals

Starfield: Multi-layer starfield background with parallax movement. Layers move at different speeds to add depth.

Nebula: Animated color clouds or gradients behind stars.

Twinkling: Random small flickers on some stars.

Performance: Render stars and nebula with GPU shaders or a WebGL particle system for efficiency. Shaders can draw millions of points with minimal impact.

On mobile, reduce star count and disable heavy effects.


{
  "StarfieldBackground": {
    "layers": 3,
    "shaderBased": true,
    "parallaxSpeeds": [0.3, 0.6, 1.0],
    "animations": {"twinkle": "random", "nebulaColor": "slowCycle"},
    "accessibility": {"ariaHidden": true}
  }
}

10. Performance & Responsiveness

Lazy Load: Use loading="lazy" on offscreen images to defer loading. Split code and assets by route if possible.

Defer Animations: Pause or simplify non-critical animations (e.g. skip background animations if not visible).

Unmount GL Scenes: After transitions, destroy previous scenes (forceContextLoss) to free GPU memory.

Seeded Layout: Use deterministic random seeds for star positions and card placements so each load is consistent.

Mobile Considerations: On small screens or low-power devices, reduce particle counts, disable 3D tilt (use flat cards), and simplify shaders. Use media queries (e.g. @media (max-width: 600px)) to adjust settings.


{
  "Performance": {
    "lazyLoadImages": true,
    "deferNonCritical": true,
    "cleanupGL": true,
    "mediaQueries": {
      "maxWidth600": {"starCount": 1000, "tiltEffect": false, "particles": 50}
    }
  }
}

11. Keyboard & Accessibility

Focus & Activation: All interactive elements (buttons, cards, avatar, chips) must be keyboard-focusable and activate on Enter/Space. Prefer native <button> or <a> where possible.

Skip Link: Include a “Skip to main content” link as the first focusable item to let users bypass navigation.

ARIA Roles: Use semantic roles (e.g. role="main", role="article", role="dialog" for any popups). For instance, blog posts and testimonials can use role="article".

Live Regions: Use aria-live="polite" for dynamically injected content (random quotes, new comments) so screen readers announce updates.

Landmarks: Mark page regions (e.g. <main>, <nav>, <header>, <footer>) to improve navigation.

Color & Contrast: Ensure all text meets WCAG contrast (≥4.5:1). Provide visible focus outlines for keyboard users.


{
  "Accessibility": {
    "keyboardSupport": true,
    "ariaRoles": ["article","region","button","status"],
    "skipLink": true,
    "liveRegions": ["randomEvent","comments"]
  }
}

12. Modular Data Structure

Store all content/data in separate JSON/JS modules for clarity:

blogs.js: Array of {id, title, excerpt, content, image}.

projects.js: Array of {id, name, description, tags, image}.

testimonials.js: Array of {id, name, role, message, rating, avatar}.

quotessayandfunfact.js: Lists of quotes, sayings, and fun facts.

personalinfo.js: Profile details (name, avatar, social links, fun facts).

others.js: Configuration (animation durations, probabilities, GL settings).


In each component’s description, include a token block listing relevant design tokens (colors, spacing, fonts) for traceability. For example, reference colorPrimary, spacingLg, etc. This ensures every visual decision links back to a design token.


{
  "DataFiles": ["blogs.js","projects.js","testimonials.js","quotessayandfunfact.js","personalinfo.js","others.js"]
}

13. Figma Component Descriptions

For each component (BlogCard, ProjectPlanet, AvatarFloating, RandomEventCard, BlogDetail), provide a JSON-like spec plus bullet notes:

Keys: Layout (size, alignment), tokens (colors, typography, shadows), animations, interactions, accessibility.

Example (BlogCard):

{
  "component": "BlogCard",
  "layout": {"width": "280px", "margin": "16px"},
  "tokens": {"bgColor": "surface", "textColor": "onSurface", "fontSize": "lg"},
  "animations": {"hoverTilt": true, "fadeIn": 250},
  "interactions": {"onClick": "openDetail", "onHover": "tilt3D"},
  "accessibility": {"role": "article", "tabIndex": 0}
}

Explain each property in bullets (e.g. “hoverTilt: enable 3D rotation on hover”).



Include visual and motion annotations (e.g. “glow intensity”, “ease-in-out curve”).

Use markdown headers and lists for clarity. Focus on performance, responsiveness, and accessibility as primary concerns.


Sources: We apply best practices from design and web standards to ensure smooth animations, efficient rendering, and full accessibility.

