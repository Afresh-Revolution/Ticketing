import { useEffect } from 'react'
import AppDownloadCard from './AppDownloadCard'

export default function DownloadPage() {
  useEffect(() => {
    const { userAgent, platform, maxTouchPoints } = navigator
    if (/android/i.test(userAgent)) {
      window.location.replace('https://play.google.com/store/apps/details?id=com.gatewav.mobile&pcampaignid=web_share')
    } else if (/iPad|iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)) {
      // iPadOS can identify itself as a desktop Mac.
      window.location.replace('https://apps.apple.com/ng/app/gatewav/id6804691930')
    }
  }, [])

  return (
    <main>
      <AppDownloadCard />
    </main>
  )
}
