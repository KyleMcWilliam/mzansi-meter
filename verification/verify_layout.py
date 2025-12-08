from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Emulate iPhone 12 to verify mobile responsiveness
        device = p.devices['iPhone 12']
        context = browser.new_context(**device)
        page = context.new_page()

        # Abort requests to external domains (Ads, Firebase, Analytics)
        page.route("**/*", lambda route: route.abort() if any(domain in route.request.url for domain in ["google", "firebase", "gstatic", "googlesyndication", "doubleclick"]) else route.continue_())

        try:
            page.goto("http://localhost:8080/index.html")

            # Wait for start screen
            page.wait_for_selector("#start-screen")

            # Take screenshot of Start Screen (verifying new header and layout)
            page.screenshot(path="verification/start_screen.png")
            print("Start Screen screenshot captured.")

            # Test Theme Toggle on Start Screen
            theme_btn = page.locator("#theme-toggle-start")
            theme_btn.click()
            page.wait_for_timeout(500) # Wait for transition
            page.screenshot(path="verification/start_screen_dark.png")
            print("Start Screen Dark Mode screenshot captured.")

            # Verify body has class 'dark-mode'
            is_dark = page.evaluate("document.body.classList.contains('dark-mode')")
            if is_dark:
                print("Dark mode class successfully added.")
            else:
                print("FAILED: Dark mode class not added.")

            # Go to Game Screen
            page.locator("#start-button").click()
            page.wait_for_selector("#game-screen.active")
            page.wait_for_timeout(500)

            # Take screenshot of Game Screen (verifying header)
            page.screenshot(path="verification/game_screen.png")
            print("Game Screen screenshot captured.")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_changes()
