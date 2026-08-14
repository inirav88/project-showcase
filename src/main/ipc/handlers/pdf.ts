import { ipcMain, dialog } from 'electron'
import type { PrismaClient } from '../../db/generated'
import { IPC_CHANNELS } from '../channels'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

export class PdfHandlers {
  constructor(private db: PrismaClient) {}

  /**
   * Generates a customized PDF brochure offline
   */
  async exportBrochure(projectId: string, customerName: string, selectedUnitIds: string[]) {
    // 1. Fetch metadata
    const project = await this.db.project.findUnique({
      where: { id: projectId },
      include: { towers: true },
    })
    if (!project) throw new Error('Project not found')

    const units = await this.db.unit.findMany({
      where: { id: { in: selectedUnitIds } },
      include: { tower: true },
    })

    // 2. Open Save Dialog (Offline export destination selection)
    const { filePath } = await dialog.showSaveDialog({
      title: 'Export Customized Brochure',
      defaultPath: path.join(process.cwd(), `${project.name.replace(/\s+/g, '_')}_Brochure.pdf`),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    })

    if (!filePath) return { success: false, reason: 'Cancelled by user' }

    // 3. Compile PDF document
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

    // Page 1: Title & Cover
    const page1 = pdfDoc.addPage([600, 800])
    page1.drawText(project.name, { x: 50, y: 700, size: 28, font, color: rgb(0.1, 0.3, 0.8) })
    page1.drawText(`Developer: ${project.developer}`, { x: 50, y: 650, size: 14, font: regularFont })
    page1.drawText(`RERA ID: ${project.reraNumber}`, { x: 50, y: 620, size: 12, font: regularFont })
    page1.drawText(`Location: ${project.location}`, { x: 50, y: 590, size: 12, font: regularFont })

    page1.drawText(`Specially Prepared For: ${customerName || 'Valued Client'}`, {
      x: 50,
      y: 400,
      size: 16,
      font,
      color: rgb(0.2, 0.2, 0.2),
    })

    // Page 2: Shortlisted Units inventory grid
    if (units.length > 0) {
      const page2 = pdfDoc.addPage([600, 800])
      page2.drawText('Selected Shortlisted Units', { x: 50, y: 720, size: 20, font })

      let yOffset = 660
      units.forEach((unit) => {
        page2.drawText(
          `${unit.tower.name} - Unit ${unit.unitNumber} (${unit.configuration})`,
          { x: 50, y: yOffset, size: 12, font }
        )
        page2.drawText(
          `Area: ${unit.carpetArea} sqft (Carpet) | Price: Rs. ${(unit.price / 100000).toFixed(2)} L | Facing: ${unit.facing}`,
          { x: 50, y: yOffset - 18, size: 10, font: regularFont }
        )
        yOffset -= 50
      })
    }

    // Save compiled file
    const pdfBytes = await pdfDoc.save()
    fs.writeFileSync(filePath, pdfBytes)

    return { success: true, filePath }
  }

  registerIpc() {
    ipcMain.handle(
      IPC_CHANNELS.PDF_EXPORT,
      (_, { projectId, customerName, selectedUnitIds }: any) =>
        this.exportBrochure(projectId, customerName, selectedUnitIds)
    )
  }
}
