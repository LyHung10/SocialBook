export class GetFlaggedPostsQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly reason?: string,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
    public readonly sortBy?: 'newest' | 'oldest' | 'violations',
  ) {}
}
