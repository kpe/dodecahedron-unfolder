
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        # Use a mobile viewport to simulate a phone
        device = p.devices['Pixel 5']
        browser = await p.chromium.launch()
        context = await browser.new_context(**device)
        page = await context.new_page()

        # Navigate to the app
        await page.goto("http://localhost:3000")

        # Wait for SVG to load
        await page.wait_for_selector("svg")

        # Take initial screenshot
        await page.screenshot(path="verification/initial.png")
        print("Initial screenshot taken")

        # Get the SVG element bounding box
        svg = await page.query_selector("svg")
        box = await svg.bounding_box()

        # Calculate center and a point to drag to
        center_x = box['x'] + box['width'] / 2
        center_y = box['y'] + box['height'] / 2

        # Simulate a touch start at the center and move to the right
        # Since Playwright's mouse.move/down/up can simulate touch in some contexts,
        # but for true touch events we might need to use CDP or touch capabilities.
        # However, since we map mouse events too, we can verify the logic works.
        # BUT the task specifically asked for touch support.
        # Playwright has 'page.touchscreen.tap' but explicit drag is manual.

        await page.touchscreen.tap(center_x + 50, center_y)
        print("Tapped at slight offset")
        await page.screenshot(path="verification/after_tap.png")

        # Now try to "drag" with touch
        # We simulate this by dispatching touch events manually if needed,
        # or relying on the fact that we can emit events.

        # Let's try to simulate a touch move sequence
        # We'll use CDP for more precise touch simulation if simple methods fail,
        # but let's try the high-level API first if available or just raw events.

        # Playwright doesn't have a high-level "touch drag", so we use CDP
        client = await context.new_cdp_session(page)

        # Touch Start
        await client.send('Input.dispatchTouchEvent', {
            'type': 'touchStart',
            'touchPoints': [{'x': center_x, 'y': center_y}]
        })

        # Touch Move
        await client.send('Input.dispatchTouchEvent', {
            'type': 'touchMove',
            'touchPoints': [{'x': center_x + 100, 'y': center_y + 100}]
        })

        # Touch End
        await client.send('Input.dispatchTouchEvent', {
            'type': 'touchEnd',
            'touchPoints': []
        })

        # Wait a bit for React to update
        await page.wait_for_timeout(500)

        await page.screenshot(path="verification/after_touch_drag.png")
        print("Touch drag screenshot taken")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
