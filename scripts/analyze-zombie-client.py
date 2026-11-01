"""Read-only references to the client animation movement controls."""
import bisect
import json
import re
import struct
from pathlib import Path
import capstone
import pefile

binary = Path('/client/H1Z1.exe').read_bytes()
pe = pefile.PE(data=binary, fast_load=True)
base = pe.OPTIONAL_HEADER.ImageBase
pe.parse_data_directories(directories=[pefile.DIRECTORY_ENTRY['IMAGE_DIRECTORY_ENTRY_EXCEPTION']])
functions = sorted((base + e.struct.BeginAddress, base + e.struct.EndAddress) for e in pe.DIRECTORY_ENTRY_EXCEPTION)
starts = [a for a, _ in functions]
strings = {}
for pattern in [b'State_Moving', b'VelocityLocalZ', b'State_Active', b'CogOrientation', b'State_Dormant', b'PredictiveUnevenTerrain']:
    for match in re.finditer(re.escape(pattern), binary):
        start = binary.rfind(b'\0', max(0, match.start()-100), match.start())+1
        end = binary.find(b'\0', match.start())
        if end-start < 250:
            strings[base+pe.get_rva_from_offset(start)] = binary[start:end].decode('ascii', 'replace')
refs = []
for section in pe.sections:
    if not section.Characteristics & 0x20000000:
        continue
    data = section.get_data()
    va = base + section.VirtualAddress
    for match in re.finditer(rb'[\x48\x4c][\x8d\x8b][\x05\x0d\x15\x1d\x25\x2d\x35\x3d]', data):
        i = match.start()
        if i+7 > len(data):
            continue
        target = va+i+7+struct.unpack_from('<i', data, i+3)[0]
        if target in strings:
            index = bisect.bisect_right(starts, va+i)-1
            refs.append({'at': hex(va+i), 'text': strings[target], 'function': [hex(v) for v in functions[index]]})
result = {'strings': {hex(k): v for k, v in strings.items()}, 'references': refs}
getters = {int(r['function'][0], 16): r['text'] for r in refs if r['text'] in ['State_Moving', 'VelocityLocalZ', 'State_Active']}
callers = []
for section in pe.sections:
    if not section.Characteristics & 0x20000000:
        continue
    data = section.get_data()
    va = base + section.VirtualAddress
    for match in re.finditer(b'\xe8', data):
        i = match.start()
        if i+5 > len(data): continue
        target = va+i+5+struct.unpack_from('<i', data, i+1)[0]
        if target in getters:
            index = bisect.bisect_right(starts, va+i)-1
            callers.append({'at':hex(va+i),'text':getters[target],'function':[hex(v) for v in functions[index]]})
result['callers'] = callers
Path('/work/npc-client-movement-refs.json').write_text(json.dumps(result, indent=2))
print(json.dumps(result, indent=2))
cs = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_64)
cs.detail = True
keys = {}
for start, name in getters.items():
    _, end = functions[bisect.bisect_right(starts, start)-1]
    offset = pe.get_offset_from_rva(start-base)
    for ins in cs.disasm(binary[offset:offset+end-start], start):
        if ins.mnemonic == 'mov' and ins.operands[0].type == capstone.x86.X86_OP_MEM and ins.operands[0].mem.base == capstone.x86.X86_REG_RIP:
            keys[ins.address+ins.size+ins.operands[0].mem.disp] = name
keyrefs = []
for section in pe.sections:
    if not section.Characteristics & 0x20000000: continue
    data = section.get_data(); va = base+section.VirtualAddress
    for match in re.finditer(rb'[\x48\x4c][\x8d\x8b][\x05\x0d\x15\x1d\x25\x2d\x35\x3d]', data):
        i=match.start()
        if i+7 > len(data): continue
        target=va+i+7+struct.unpack_from('<i',data,i+3)[0]
        if target in keys:
            index=bisect.bisect_right(starts,va+i)-1
            keyrefs.append({'at':hex(va+i),'text':keys[target],'function':[hex(v) for v in functions[index]]})
result['keyrefs'] = keyrefs
Path('/work/npc-client-movement-refs.json').write_text(json.dumps(result, indent=2))
print('CONTROL KEY REFERENCES', json.dumps(keyrefs, indent=2))
lines = []
extra = [functions[bisect.bisect_right(starts, a)-1] for a in [0x140519410]]
for start, end in sorted(set([tuple(int(a, 16) for a in r['function']) for r in keyrefs+callers] + extra)):
    lines.append(f'FUNCTION {start:#x}..{end:#x}')
    offset = pe.get_offset_from_rva(start-base)
    for ins in cs.disasm(binary[offset:offset+end-start], start):
        lines.append(f'{ins.address:#x}: {ins.mnemonic:10} {ins.op_str}')
Path('/work/npc-client-movement-disassembly.txt').write_text('\n'.join(lines))
