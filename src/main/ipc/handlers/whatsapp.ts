import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client/showcase-client'
import { IPC_CHANNELS } from '../channels'

export interface WhatsappSendPayload {
  phone: string
  clientName: string
  projectName: string
  brochureUrl: string
}

export class WhatsappHandlers {
  constructor(private db: PrismaClient) {}

  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) return `91${cleaned}`
    return cleaned
  }

  async sendApi(payload: WhatsappSendPayload) {
    const settings = await this.db.settings.findUnique({ where: { id: 1 } })
    if (!settings?.whatsappApiToken || !settings?.whatsappApiPhoneNumberId) {
      return { success: false, reason: 'WhatsApp API credentials missing in Admin Settings.' }
    }

    const formattedPhone = this.formatPhoneNumber(payload.phone)
    const template = settings.whatsappMessageTemplate || 'Hi {clientName}, here is the brochure for {projectName}: {brochureUrl}'
    const message = template
      .replace(/{clientName}/g, payload.clientName || 'Valued Client')
      .replace(/{projectName}/g, payload.projectName || 'Project')
      .replace(/{brochureUrl}/g, payload.brochureUrl || '')

    try {
      if (settings.whatsappApiProvider === 'META_CLOUD') {
        const url = `https://graph.facebook.com/v18.0/${settings.whatsappApiPhoneNumberId}/messages`
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.whatsappApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: { body: message },
          }),
        })
        if (!res.ok) {
          const errText = await res.text()
          return { success: false, reason: `Meta API returned ${res.status}: ${errText}` }
        }
        return { success: true, message: 'Brochure sent via WhatsApp API' }
      }
      return { success: false, reason: 'Unsupported WhatsApp API provider' }
    } catch (err: any) {
      return { success: false, reason: err?.message || 'Unknown network error' }
    }
  }

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.WHATSAPP_SEND_API, (_, payload: WhatsappSendPayload) => this.sendApi(payload))
  }
}
