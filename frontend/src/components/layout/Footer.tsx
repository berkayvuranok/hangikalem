import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--line)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-4">
        <div>
          <p className="font-serif text-xl">HangiKalem</p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Sana uygun kalemi bul. Yazım tarzına göre keşfet, karşılaştır, karar ver.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-medium">Keşfet</p>
          <div className="flex flex-col gap-2 text-[var(--muted)]">
            <Link to="/pens">Kalemler</Link>
            <Link to="/find">Kalemimi Bul</Link>
            <Link to="/compare">Karşılaştır</Link>
            <Link to="/#brands">Markalar</Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-medium">Hesap</p>
          <div className="flex flex-col gap-2 text-[var(--muted)]">
            <Link to="/login">Giriş</Link>
            <Link to="/register">Kayıt</Link>
            <Link to="/favorites">Favoriler</Link>
          </div>
        </div>
        <div className="text-sm text-[var(--muted)]">
          <p>© {new Date().getFullYear()} HangiKalem</p>
          <p className="mt-2">Premium bir ürün keşif deneyimi.</p>
        </div>
      </div>
    </footer>
  )
}
