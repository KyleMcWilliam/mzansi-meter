import os
import sys
import time
import subprocess
import signal
from playwright.sync_api import sync_playwright

def verify_styles():
    # Start HTTP server
    server = subprocess.Popen([sys.executable, "-m", "http.server", "8000"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("HTTP Server started on port 8000")

    try:
        # Give server a moment to start
        time.sleep(2)

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()

            def abort_route(route):
                url = route.request.url
                if "google" in url or "firebase" in url or "doubleclick" in url:
                    route.abort()
                else:
                    route.continue_()

            page = context.new_page()
            page.route("**/*", abort_route)

            page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))

            # Go to localhost
            page.goto("http://localhost:8000/index.html")

            # Wait for loading screen to disappear
            try:
                page.wait_for_selector("#loading-screen", state="hidden", timeout=5000)
                print("Loading screen disappeared.")
            except:
                print("Timeout waiting for loading screen.")
                page.screenshot(path="verification/loading_timeout.png")

            # Verify visuals
            container_styles = page.eval_on_selector("#game-container", """el => {
                const style = getComputedStyle(el);
                return {
                    borderRadius: style.borderRadius,
                    backdropFilter: style.backdropFilter || style.webkitBackdropFilter
                }
            }""")

            if container_styles["borderRadius"] == "32px":
                print("SUCCESS: #game-container border-radius is 32px.")
            else:
                print(f"FAILURE: #game-container border-radius is {container_styles['borderRadius']}")

            if "blur(12px)" in container_styles["backdropFilter"]:
                print("SUCCESS: #game-container has backdrop-filter blur(12px).")
            else:
                print(f"WARNING: #game-container backdrop-filter is {container_styles['backdropFilter']}")

            # Verify Transition
            print("Clicking Start Button...")
            page.click("#start-button")

            # Wait for transition
            time.sleep(1)

            game_screen_visible = page.is_visible("#game-screen")
            start_screen_visible = page.is_visible("#start-screen")

            if game_screen_visible and not start_screen_visible:
                print("SUCCESS: Transition to Game Screen successful.")
            else:
                print(f"FAILURE: Transition failed. Game Screen Visible: {game_screen_visible}, Start Screen Visible: {start_screen_visible}")

            page.screenshot(path="verification/game_screen_success.png")
            browser.close()

    finally:
        server.terminate()
        print("HTTP Server stopped.")

if __name__ == "__main__":
    verify_styles()
