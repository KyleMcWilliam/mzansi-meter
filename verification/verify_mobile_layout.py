from playwright.sync_api import sync_playwright

def verify_mobile_layout():
    with sync_playwright() as p:
        # Simulate an iPhone 12 Pro (390x844) to test mobile layout
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
        )
        page = context.new_page()

        # Block external ads/firebase to speed up load
        page.route("**/*adsbygoogle*", lambda route: route.abort())
        page.route("**/*firebase*", lambda route: route.abort())
        page.route("**/*googlesyndication*", lambda route: route.abort())

        try:
            page.goto("http://localhost:8080")
            page.wait_for_load_state("networkidle")

            # Click "Endless Mode" to see the game screen
            page.click("#start-button")

            # Wait for game screen to be active
            page.wait_for_selector("#game-screen.active")

            # Screenshot the game screen to verify header layout and buttons
            page.screenshot(path="verification/mobile_game_screen.png")
            print("Screenshot saved to verification/mobile_game_screen.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_mobile_layout()
