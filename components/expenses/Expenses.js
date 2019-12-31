import React from 'react';
import PropTypes from 'prop-types';
import { ButtonGroup, Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { get } from 'lodash';
import { Box } from '@rebass/grid';

import colors from '../../lib/constants/colors';

import Expense from './Expense';
import Loading from '../Loading';

class Expenses extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    host: PropTypes.object,
    expenses: PropTypes.array,
    fetchMore: PropTypes.func,
    status: PropTypes.string,
    updateVariables: PropTypes.func,
    editable: PropTypes.bool,
    loading: PropTypes.bool,
    view: PropTypes.string, // "compact" for homepage (can't edit expense, don't show header), "summary" for list view, "details" for details view
    includeHostedCollectives: PropTypes.bool,
    filters: PropTypes.bool, // show or hide filters (all/pending/paid)
    LoggedInUser: PropTypes.object,
    refetch: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = { isPayActionLocked: {} };
  }

  setPayActionLock(val) {
    this.setState({ isPayActionLocked: val });
  }

  renderExpense(expense) {
    const { host, collective, LoggedInUser, editable, view, includeHostedCollectives } = this.props;

    return (
      <div className="item" key={expense.id}>
        <Expense
          collective={expense.collective || collective}
          host={host}
          expense={expense}
          editable={editable}
          refetch={this.props.refetch}
          view={view}
          includeHostedCollectives={includeHostedCollectives}
          LoggedInUser={LoggedInUser}
          allowPayAction={!this.state.isPayActionLocked[(expense.collective || collective).id]}
          lockPayAction={this.setPayActionLock.bind(this, { [(expense.collective || collective).id]: true })}
          unlockPayAction={this.setPayActionLock.bind(this, {
            [(expense.collective || collective).id]: false,
          })}
        />
      </div>
    );
  }

  render() {
    const { collective, expenses, filters, status, loading, updateVariables } = this.props;

    let filteredExpenses;
    if (expenses && status === 'READY') {
      // Don't show expense when collective doesn't have enough fund in "ready to pay" filter
      filteredExpenses = expenses.filter(
        expense => get(expense.collective || collective, 'stats.balance') >= expense.amount,
      );
      // Don't show expense that requires tax form in "ready to pay" filter
      filteredExpenses = filteredExpenses.filter(expense => !expense.userTaxFormRequiredBeforePayment);
    } else {
      filteredExpenses = expenses || [];
    }

    return (
      <Box className="Expenses" mx="auto" maxWidth="80rem">
        <style jsx>
          {`
            :global(.loadMoreBtn) {
              margin: 1rem;
              text-align: center;
            }
            .filter {
              max-width: 500px;
              width: 100%;
              margin: 0 auto;
              margin-bottom: 20px;
              overflow-x: auto;
            }
            :global(.filterBtnGroup) {
              width: 100%;
              display: flex;
              justify-content: center;
            }
            :global(.filterBtn) {
              width: 25%;
            }
            .empty {
              text-align: center;
              margin: 4rem;
              color: ${colors.darkgray};
            }
            .itemsList {
              position: relative;
            }
            .itemsList .item {
              border-bottom: 1px solid #e8e9eb;
            }
          `}
        </style>

        {filters && (
          <div className="filter">
            <ButtonGroup className="filterBtnGroup">
              <Button
                className="filterBtn all"
                bsSize="small"
                bsStyle={!status ? 'primary' : 'default'}
                onClick={() => updateVariables({ status: null })}
              >
                <FormattedMessage id="expenses.all" defaultMessage="all" />
              </Button>
              <Button
                className="filterBtn pending"
                bsSize="small"
                bsStyle={status === 'PENDING' ? 'primary' : 'default'}
                onClick={() => updateVariables({ status: 'PENDING' })}
              >
                <FormattedMessage id="expenses.pending" defaultMessage="pending" />
              </Button>
              <Button
                className="filterBtn pending"
                bsSize="small"
                bsStyle={status === 'REJECTED' ? 'primary' : 'default'}
                onClick={() => updateVariables({ status: 'REJECTED' })}
              >
                <FormattedMessage id="expenses.rejected" defaultMessage="rejected" />
              </Button>
              <Button
                className="filterBtn approved"
                bsSize="small"
                bsStyle={status === 'APPROVED' ? 'primary' : 'default'}
                onClick={() => updateVariables({ status: 'APPROVED' })}
              >
                <FormattedMessage id="expenses.approved" defaultMessage="approved" />
              </Button>
              <Button
                className="filterBtn ready"
                bsSize="small"
                bsStyle={status === 'READY' ? 'primary' : 'default'}
                onClick={() => updateVariables({ status: 'READY' })}
              >
                <FormattedMessage id="expenses.ready" defaultMessage="ready to pay" />
              </Button>
              <Button
                className="filterBtn paid"
                bsSize="small"
                bsStyle={status === 'PAID' ? 'primary' : 'default'}
                onClick={() => updateVariables({ status: 'PAID' })}
              >
                <FormattedMessage id="expenses.paid" defaultMessage="paid" />
              </Button>
            </ButtonGroup>
          </div>
        )}

        <div className="itemsList">
          {loading ? (
            <Box my={5}>
              <Loading />
            </Box>
          ) : (
            <React.Fragment>
              {filteredExpenses.map(expense => this.renderExpense(expense))}
              {filteredExpenses.length === 0 && (
                <div className="empty">
                  <FormattedMessage id="expenses.empty" defaultMessage="No expenses" />
                </div>
              )}
              {filteredExpenses.length >= 10 && filteredExpenses.length % 10 === 0 && (
                <div className="loadMoreBtn">
                  <Button bsStyle="default" onClick={this.props.fetchMore}>
                    {loading && <FormattedMessage id="loading" defaultMessage="loading" />}
                    {!loading && <FormattedMessage id="loadMore" defaultMessage="load more" />}
                  </Button>
                </div>
              )}
            </React.Fragment>
          )}
        </div>
      </Box>
    );
  }
}

export default Expenses;
