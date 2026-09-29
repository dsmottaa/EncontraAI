import subprocess
import time

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

views = [
    ('home_screen.png', 'http://localhost:3000/#home'),
    ('feed_screen.png', 'http://localhost:3000/#feed'),
    ('messages_screen.png', 'http://localhost:3000/#messages'),
    ('dashboard_screen.png', 'http://localhost:3000/#my-items'),
    ('profile_screen.png', 'http://localhost:3000/#profile'),
    ('create_screen.png', 'http://localhost:3000/#create-item')
]

for name, url in views:
    out = rf'c:\Users\barbara\Desktop\EncontraAÍ\rascunho\{name}'
    cmd = [
        edge_path,
        '--headless',
        '--disable-gpu',
        f'--screenshot={out}',
        '--window-size=1284,2600',
        '--virtual-time-budget=4000',
        url
    ]
    subprocess.run(cmd, check=True)
    print(f'Captured {name}')
