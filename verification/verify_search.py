from playwright.sync_api import sync_playwright
import time

def verify_search_bar():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Inject auth cookie
        context.add_cookies([{
            "name": "hievly_auth",
            "value": "true",
            "domain": "localhost",
            "path": "/"
        }])

        page = context.new_page()

        # Intercept the suggestions API to delay it, so we can see the spinner
        def handle_route(route):
            time.sleep(2) # Delay for 2 seconds
            try:
                route.continue_()
            except:
                pass

        page.route("**/api/suggestions**", handle_route)

        print("Navigating to home...")
        page.goto("http://localhost:3000")

        # Wait for the search input
        # Using the new aria-label we added
        search_input = page.get_by_label("Search music")

        # Wait for hydration
        page.wait_for_timeout(2000)

        print("Typing query...")
        search_input.fill("Metallica")

        # Wait a bit for debounce (300ms) + initial render of spinner
        # We want to catch the spinner before the 2s delay ends
        time.sleep(0.6)

        # Take screenshot of loading state
        print("Taking screenshot of loading state...")
        page.screenshot(path="verification/search_loading.png")

        # Wait for suggestions to appear (after the delay)
        print("Waiting for suggestions...")
        page.wait_for_timeout(3000) # Wait for the delayed response

        # Take screenshot of suggestions
        print("Taking screenshot of suggestions...")
        page.screenshot(path="verification/search_results.png")

        browser.close()

if __name__ == "__main__":
    verify_search_bar()
