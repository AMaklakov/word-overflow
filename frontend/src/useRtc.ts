import { useEffect, useMemo } from 'react'
import { useObservableState } from 'observable-hooks'
import Socket from './web-socket'

enum Messages {
  Offer = 'offer',
  Answer = 'answer',
  ReadyForConnection = 'readyCreate',
  ReadyForCreation = 'readyConnect',
  CandidateOffer = 'candidateOffer',
  CandidateAnswer = 'candidateAnswer',
}
