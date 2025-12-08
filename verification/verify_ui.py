from playwright.sync_api import sync_playwright, expect
import time
import re

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Test 1: Mobile View (Pixel 7)
        print("\n--- Verifying Mobile View ---")
        context_mobile = browser.new_context(viewport={'width': 412, 'height': 915})
        page_mobile = context_mobile.new_page()
        run_verification(page_mobile, "mobile")

        # Test 2: Desktop View
        print("\n--- Verifying Desktop View ---")
        context_desktop = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page_desktop = context_desktop.new_page()
        run_verification(page_desktop, "desktop")

        browser.close()

def run_verification(page, name_prefix):
    # Block ads and google analytics
    page.route("**/*adsbygoogle*", lambda route: route.abort())
    page.route("**/*google-analytics*", lambda route: route.abort())
    page.route("**/*firebase*", lambda route: route.abort())

    try:
        print(f"[{name_prefix}] Navigating to app...")
        page.goto("http://localhost:8080")

        # Hide toast container to clear view
        page.add_style_tag(content="#toast-container { display: none !important; }")

        # Wait for loading screen to disappear
        page.wait_for_selector("#loading-screen", state="hidden", timeout=10000)

        # Verify Start Screen
        print(f"[{name_prefix}] Verifying Start Screen...")
        expect(page.locator("#start-screen")).to_be_visible()
        expect(page.locator(".start-header")).to_be_visible()

        # Take screenshot of Start Screen
        page.screenshot(path=f"verification/{name_prefix}_start_screen.png")
        print(f"[{name_prefix}] Captured start_screen.png")

        # Click Endless Mode
        print(f"[{name_prefix}] Starting game...")
        page.click("#start-button")

        # Verify Game Screen
        print(f"[{name_prefix}] Verifying Game Screen...")
        page.wait_for_selector("#game-screen", state="visible")
        expect(page.locator("#game-screen")).to_be_visible()
        expect(page.locator(".game-header")).to_be_visible()

        # Verify specific game header elements
        expect(page.locator("#lives-display")).to_be_visible()
        expect(page.locator("#score-streak")).to_be_visible()
        expect(page.locator("#theme-toggle-game")).to_be_visible()

        # Take screenshot of Game Screen
        page.screenshot(path=f"verification/{name_prefix}_game_screen.png")
        print(f"[{name_prefix}] Captured game_screen.png")

        # Toggle Theme
        print(f"[{name_prefix}] Toggling theme...")
        page.click("#theme-toggle-game")

        # Verify Dark Mode
        print(f"[{name_prefix}] Verifying Dark Mode...")
        expect(page.locator("body")).to_have_class(re.compile(r"dark-mode"))
        time.sleep(0.5) # Wait for transition
        page.screenshot(path=f"verification/{name_prefix}_game_screen_dark.png")
        print(f"[{name_prefix}] Captured game_screen_dark.png")

    except Exception as e:
        print(f"[{name_prefix}] Error: {e}")
        page.screenshot(path=f"verification/{name_prefix}_error_state.png")

if __name__ == "__main__":
    verify_ui()
