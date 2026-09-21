/**
 * Mengkompresi file gambar menggunakan Canvas API sebelum diunggah ke server.
 * Menghasilkan file dalam format WebP dengan lebar maksimal 1200px dan kualitas 70%.
 */
export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200

        let width = img.width
        let height = img.height

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width)
          width = MAX_WIDTH
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '') + '.webp',
                {
                  type: 'image/webp',
                  lastModified: Date.now(),
                },
              )
              resolve(compressedFile)
            } else {
              reject(new Error('Canvas to Blob failed'))
            }
          },
          'image/webp',
          0.7,
        ) // Kualitas 70%
      }
      img.onerror = (error) => reject(error)
    }
    reader.onerror = (error) => reject(error)
  })
}
