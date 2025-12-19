from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Abort external requests to prevent timeouts
        page.route("**/*", lambda route: route.abort() if "google" in route.request.url or "firebase" in route.request.url or "jsdelivr" in route.request.url else route.continue_())

        # Load the local index.html
        # We use wait_until='domcontentloaded' to avoid waiting for all assets if they are slow/blocked
        page.goto(f"file://{os.getcwd()}/index.html", wait_until="domcontentloaded")

        # 1. Verify Timer Container exists
        # It might be in the DOM but hidden depending on CSS/JS state, but we check presence first
        timer_container = page.locator("#timer-container")
        if timer_container.count() > 0:
            print("PASS: #timer-container found in DOM.")
        else:
            print("FAIL: #timer-container NOT found.")

        # 2. Verify basic visibility of Start Screen
        # The loading screen might be covering it initially, so we might need to wait or check presence
        start_screen = page.locator("#start-screen")
        if start_screen.count() > 0:
             print("PASS: Start screen element exists.")
        else:
             print("FAIL: Start screen element NOT found.")

        browser.close()

if __name__ == "__main__":
    run()
