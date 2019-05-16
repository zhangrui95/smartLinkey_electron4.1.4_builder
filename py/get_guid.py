# -*- coding: utf-8 -*-

import uuid
import os

def gen_guid():
    return uuid.uuid5(uuid.NAMESPACE_DNS, 'SmartLinkey')


if not os.path.exists('./guid.txt'):
    with open('./guid.txt', 'w') as f:
        guid = gen_guid()
        print(str(guid))
        f.write(str(guid))
else:
    print("guid already exists")