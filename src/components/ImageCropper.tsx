import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { RotateCcw, ZoomIn, ZoomOut, Check, X } from 'lucide-react'

interface ImageCropperProps {
  isOpen: boolean
  onClose: () => void
  onCrop: (croppedImage: string) => void
  imageSrc: string
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  isOpen,
  onClose,
  onCrop,
  imageSrc
}) => {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (isOpen && imageSrc) {
      const img = new Image()
      img.onload = () => {
        if (imageRef.current) {
          imageRef.current.src = imageSrc
          drawImage()
        }
      }
      img.src = imageSrc
    }
  }, [isOpen, imageSrc])

  const drawImage = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const img = imageRef.current

    if (!canvas || !ctx || !img) return

    // Set canvas size
    canvas.width = 400
    canvas.height = 400

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Create circular clipping path
    ctx.save()
    ctx.beginPath()
    ctx.arc(200, 200, 150, 0, 2 * Math.PI)
    ctx.clip()

    // Calculate image dimensions and position
    const imgWidth = img.naturalWidth
    const imgHeight = img.naturalHeight
    const canvasSize = 400
    const cropSize = 300

    // Calculate scaled dimensions
    const scaledWidth = imgWidth * scale
    const scaledHeight = imgHeight * scale

    // Calculate position
    const x = 200 - (scaledWidth / 2) + position.x
    const y = 200 - (scaledHeight / 2) + position.y

    // Apply rotation
    ctx.translate(200, 200)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-200, -200)

    // Draw image
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight)

    ctx.restore()

    // Draw crop circle outline
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(200, 200, 150, 0, 2 * Math.PI)
    ctx.stroke()
  }

  useEffect(() => {
    drawImage()
  }, [scale, rotation, position])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleCrop = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Create a new canvas for the cropped image
    const croppedCanvas = document.createElement('canvas')
    const croppedCtx = croppedCanvas.getContext('2d')
    
    if (!croppedCtx) return

    croppedCanvas.width = 300
    croppedCanvas.height = 300

    // Draw the cropped circular image
    croppedCtx.save()
    croppedCtx.beginPath()
    croppedCtx.arc(150, 150, 150, 0, 2 * Math.PI)
    croppedCtx.clip()

    // Calculate the crop area from the main canvas
    const sourceCanvas = canvas
    croppedCtx.drawImage(sourceCanvas, 0, 0)

    croppedCtx.restore()

    // Convert to base64
    const croppedImage = croppedCanvas.toDataURL('image/jpeg', 0.9)
    onCrop(croppedImage)
    onClose()
  }

  const resetImage = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Crop Profile Photo
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Canvas Container */}
          <div className="relative mx-auto w-[400px] h-[400px] bg-gray-100 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              className="hidden"
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Scale Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  Scale
                </label>
                <span className="text-sm text-gray-500">{Math.round(scale * 100)}%</span>
              </div>
              <Slider
                value={[scale]}
                onValueChange={(value) => setScale(value[0])}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Rotation Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Rotation
                </label>
                <span className="text-sm text-gray-500">{rotation}°</span>
              </div>
              <Slider
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                min={-180}
                max={180}
                step={1}
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={resetImage}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleCrop}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Apply Crop
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImageCropper 