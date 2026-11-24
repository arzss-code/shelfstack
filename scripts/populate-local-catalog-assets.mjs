import { existsSync, createWriteStream } from 'node:fs'
import { resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'

const ASSETS_MAP = [
  // Keyboards
  {
    filename: 'keyboard-75-navy.jpg',
    url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'keyboard-75-angle.jpg',
    url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
  },

  // Mouse
  {
    filename: 'mouse-ergonomic-gray.jpg',
    url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'mouse-ergonomic-white.jpg',
    url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
  },

  // Chargers
  {
    filename: 'charger-gan-black.jpg',
    url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'charger-gan-white.jpg',
    url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80',
  },

  // Laptop Stand
  {
    filename: 'laptop-stand-silver.jpg',
    url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'laptop-stand-gray.jpg',
    url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80',
  },

  // Headphones
  {
    filename: 'headphone-anc-black.jpg',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'headphone-anc-silver.jpg',
    url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
  },

  // Desk
  {
    filename: 'desk-oak-natural.jpg',
    url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'desk-oak-walnut.jpg',
    url: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=800&q=80',
  },

  // Chair
  {
    filename: 'chair-mesh-black.jpg',
    url: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'chair-mesh-gray.jpg',
    url: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80',
  },

  // Desk Lamp
  {
    filename: 'lamp-task-black.jpg',
    url: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'lamp-task-white.jpg',
    url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
  },

  // Monitor Stand
  {
    filename: 'monitor-stand-walnut.jpg',
    url: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'monitor-stand-oak.jpg',
    url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
  },

  // Desk Mat
  {
    filename: 'desk-mat-black.jpg',
    url: 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'desk-mat-brown.jpg',
    url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
  },

  // Coffee
  {
    filename: 'dripper-v60-white.jpg',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'dripper-v60-black.jpg',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'kettle-gooseneck-black.jpg',
    url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'coffee-grinder-silver.jpg',
    url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'coffee-grinder-black.jpg',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'glass-borosilicate-clear.jpg',
    url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'glass-borosilicate-amber.jpg',
    url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'coffee-canister-black.jpg',
    url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'coffee-canister-silver.jpg',
    url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
  },

  // Lifestyle & Apparel
  {
    filename: 'wallet-leather-tan.jpg',
    url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'wallet-leather-black.jpg',
    url: 'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'field-watch-black-angle.jpg',
    url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'backpack-edc-black.jpg',
    url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'backpack-edc-green.jpg',
    url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'tshirt-heavyweight-white.jpg',
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'tshirt-heavyweight-black.jpg',
    url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'cap-baseball-black.jpg',
    url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'cap-baseball-khaki.jpg',
    url: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=800&q=80',
  },

  // Stationery
  {
    filename: 'journal-grid-green.jpg',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'journal-grid-black.jpg',
    url: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'pen-titanium-raw.jpg',
    url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'pen-titanium-black.jpg',
    url: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'ruler-architect-black.jpg',
    url: 'https://images.unsplash.com/photo-1589365278144-c9e705f843ba?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'pencil-roll-brown.jpg',
    url: 'https://images.unsplash.com/photo-1569683795645-b62e50fbf103?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'pencil-roll-tan.jpg',
    url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'clips-brass-vintage.jpg',
    url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80',
  },
]

async function main() {
  const targetDir = resolve(process.cwd(), 'public/images/products')
  console.log(`Starting asset population to: ${targetDir}`)

  for (const asset of ASSETS_MAP) {
    const filePath = resolve(targetDir, asset.filename)
    if (existsSync(filePath)) {
      console.log(`[SKIP] Already exists: ${asset.filename}`)
      continue
    }

    try {
      console.log(`[FETCH] Downloading ${asset.filename}...`)
      const res = await fetch(asset.url)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      const fileStream = createWriteStream(filePath)
      // @ts-expect-error Node fetch body typing
      await pipeline(Readable.fromWeb(res.body), fileStream)
      console.log(`[OK] Saved ${asset.filename}`)
    } catch (err) {
      console.error(`[ERROR] Failed to download ${asset.filename}:`, err.message)
    }
  }

  console.log('Finished populating local catalog assets.')
}

main()
