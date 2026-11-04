import posthog from "posthog-js";

/**
 * Keeps browser page translation (Chrome's built-in Google Translate, mostly) from crashing
 * React.
 *
 * Translation replaces text nodes React rendered with its own <font> wrappers. When React later
 * updates that part of the page it calls removeChild/insertBefore with a node that is no longer
 * where React left it, the browser throws NotFoundError, and the page dies. PostHog showed this
 * as the top crash: "Failed to execute 'removeChild' on 'Node'" and the 'insertBefore' twin, on
 * Android Chrome, for users whose language we were not serving.
 *
 * The fix is the long-standing workaround from the React issue tracker
 * (facebook/react#11538): when the node isn't where React expects it, skip the operation
 * instead of throwing. The worst case is a stale or missing bit of translated text until the
 * next re-render, which beats an error screen.
 *
 * Serving the user's own language (see localeFromAcceptLanguage in i18n/config.ts) removes
 * most of the reason to translate; this covers everyone on a language we don't ship.
 *
 * Imported for its side effect by app/ClientRoot.tsx, so it runs before React first commits.
 */

let reported = false;

/**
 * One event per page load when the guard actually fires, so the crash we no longer see in
 * Error tracking stays visible. `page_translated` confirms (or rules out) translation as the
 * cause: Google Translate tags <html> with a translated-ltr / translated-rtl class.
 */
function reportConflict(operation: "removeChild" | "insertBefore") {
  if (reported) return;
  reported = true;
  try {
    if (!posthog.__loaded) return;
    const html = document.documentElement;
    posthog.capture("dom_conflict_prevented", {
      operation,
      page_translated: /\btranslated-(ltr|rtl)\b/.test(html.className),
      html_lang: html.lang,
      path: window.location.pathname,
    });
  } catch {
    // Reporting is best-effort.
  }
}

function installGuard() {
  if (typeof window === "undefined" || typeof Node !== "function" || !Node.prototype) return;

  const guardedFlag = "__movmashDomGuard";
  const proto = Node.prototype as Node & Record<string, unknown>;
  if (proto[guardedFlag]) return; // Hot reload in dev would otherwise wrap twice.
  proto[guardedFlag] = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      reportConflict("removeChild");
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    this: Node,
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      reportConflict("insertBefore");
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

installGuard();
