import { fetchAssemblyResults, fetchConstituencyProfile, fetchLokSabhaResults } from '../api/electionApi'
import { useAsync } from './useAsync'

// Thin, named hooks so pages read as "what data do I need" rather than "how to fetch it".

export const useConstituencyProfile = () => useAsync(fetchConstituencyProfile)
export const useLokSabhaResults = () => useAsync(fetchLokSabhaResults)
export const useAssemblyResults = () => useAsync(fetchAssemblyResults)
