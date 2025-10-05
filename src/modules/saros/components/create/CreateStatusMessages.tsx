import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface CreateStatusMessagesProps {
  errorMessage: string | null
  successMessage: string | null
}

const CreateStatusMessages = ({ errorMessage, successMessage }: CreateStatusMessagesProps) => {
  return (
    <div className="space-y-2">
      {errorMessage && (
        <Card className="border-red-500/50 bg-red-500/10 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-500">{errorMessage}</p>
          </div>
        </Card>
      )}

      {successMessage && (
        <Card className="border-green-500/50 bg-green-500/10 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
            <p className="text-sm text-green-500 break-all">{successMessage}</p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default CreateStatusMessages
