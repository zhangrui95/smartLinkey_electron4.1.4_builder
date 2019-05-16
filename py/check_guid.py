# -*- coding: utf-8 -*-

import json
import os

path = "." if os.path.exists('node_modules') else ".."


if not os.path.exists(path + '/guid.txt'):
    print("Guid file not found")
    os._exit(-1)

with open(path + '/package.json', 'r') as f:
    data = f.read()
    json_data = json.loads(data)
    try:
        guid_from_package_json = json_data['build']['nsis']['guid']
        print(guid_from_package_json + " (package.json)")
    except:
        print("Package.json guid field not found")
        os._exit(-1)

    with open(path + '/guid.txt', 'r') as f:
        guid_from_file = f.read().strip()
        print(guid_from_file + " (guid.txt)")
        if guid_from_file == guid_from_package_json:
            print("Check ok")
            os._exit(0)
        else:
            print("Not equal!")
            os._exit(-1)

