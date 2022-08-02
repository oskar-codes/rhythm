from os import listdir

from os.path import isfile, join

from os import walk

instruments = []

for (dirpath, dirnames, filenames) in walk('./public/samples', ):
    instruments.extend(dirnames)
    break

f = open("./src/samples.js", "a")

f.write('export const urls = {\n')

for instrument in instruments:
  files = [f for f in listdir(f'./public/samples/{instrument}') if isfile(join(f'./public/samples/{instrument}', f))]
  f.write(f'  "{instrument}":'+'{\n')

  filtered = [a for a in files if '.wav' in a]
  for file in filtered:
    s=file.replace('s', '#').replace('.wav', '')
    f.write(f'    "{s}": "{file}",\n')

  f.write('   },\n')

f.write('  }\n')

f.write('}')

f.close()