
import struct

def get_image_info(file_path):
    with open(file_path, 'rb') as f:
        data = f.read(26)
        # PNG signature
        if data[:8] != b'\x89PNG\r\n\x1a\n':
            return "Not a PNG"
        # IHDR chunk
        w, h = struct.unpack('>LL', data[16:24])
        return f"{w}x{h}"

try:
    print(get_image_info('public/pwa-icon.png'))
except Exception as e:
    print(e)
